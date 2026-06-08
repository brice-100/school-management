#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='))?.split('=').slice(1).join('=')
  || args[args.indexOf('--url') + 1];
const apply = args.includes('--apply') || args.includes('-a');
const rename = args.includes('--rename') || args.includes('-r');
const drop = args.includes('--drop') || args.includes('-d');

const dbUrl = urlArg || process.env.RAILWAY_DB_URL || process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;
if (!dbUrl) {
  console.error('Usage: node clean_railway_schema.js --url "mysql://user:pass@host:port/dbname" [--rename] [--drop] [--apply]');
  process.exit(1);
}

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

function loadCanonicalTableNames() {
  const sqlPath = path.join(__dirname, 'school_fixed.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Fichier SQL introuvable : ${sqlPath}`);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const tableNames = new Set();
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`([^`]+)`/gi;
  let match;
  while ((match = re.exec(sql)) !== null) {
    tableNames.add(match[1]);
  }
  return Array.from(tableNames);
}

async function listTables(pool, database) {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
    [database]
  );
  return rows.map(r => r.TABLE_NAME);
}

function groupByLowercase(names) {
  const groups = {};
  for (const name of names) {
    const lower = name.toLowerCase();
    if (!groups[lower]) groups[lower] = [];
    groups[lower].push(name);
  }
  return groups;
}

async function main() {
  const creds = parseDbUrl(dbUrl);
  console.log(`\n📡 Connexion à Railway MySQL → ${creds.host}:${creds.port}/${creds.database}`);
  console.log(`   apply=${apply} rename=${rename} drop=${drop}\n`);

  const pool = mysql.createPool({
    ...creds,
    multipleStatements: true,
    ssl: { rejectUnauthorized: false },
  });

  const canonicalNames = loadCanonicalTableNames();
  const canonicalByLower = Object.fromEntries(canonicalNames.map(n => [n.toLowerCase(), n]));
  const existing = await listTables(pool, creds.database);
  const groups = groupByLowercase(existing);

  const actions = [];

  for (const [lower, names] of Object.entries(groups)) {
    const preferredCanonical = canonicalByLower[lower];
    if (names.length > 1) {
      console.log(`⚠️  Doublons détectés pour '${lower}': ${names.join(', ')}`);
      if (preferredCanonical && names.includes(preferredCanonical)) {
        const toDrop = names.filter(name => name !== preferredCanonical);
        actions.push({ type: 'drop', reason: 'duplicate', preferred: preferredCanonical, targets: toDrop });
      } else if (preferredCanonical) {
        // no exact preferred version; choose first variant to rename
        const source = names[0];
        actions.push({ type: 'rename', from: source, to: preferredCanonical, reason: 'canonical', targets: [source] });
        if (names.length > 1) {
          const others = names.slice(1);
          actions.push({ type: 'drop', reason: 'duplicate after rename', preferred: preferredCanonical, targets: others });
        }
      } else {
        console.log(`   - Aucune table canonique connue pour '${lower}', examen manuel nécessaire.`);
      }
    } else {
      const [name] = names;
      if (preferredCanonical && name !== preferredCanonical) {
        console.log(`ℹ️  Table '${name}' correspond à la table canonique '${preferredCanonical}'.`);
        actions.push({ type: 'rename', from: name, to: preferredCanonical, reason: 'standardization' });
      }
    }
  }

  if (actions.length === 0) {
    console.log('\n✅ Aucun ajustement de casse/copie nécessaire pour les tables existantes.');
    await pool.end();
    return;
  }

  console.log('\n--- Actions proposées ---');
  actions.forEach((action, index) => {
    if (action.type === 'drop') {
      console.log(`${index + 1}. DROP TABLE ${action.targets.join(', ')} (garder ${action.preferred})`);
    } else if (action.type === 'rename') {
      console.log(`${index + 1}. RENAME TABLE \`${action.from}\` TO \`${action.to}\` (${action.reason})`);
    }
  });

  if (!apply) {
    console.log('\n⚠️  Mode aperçu seulement. Ajoute --apply pour exécuter ces actions.');
    await pool.end();
    return;
  }

  console.log('\n🚀 Exécution des actions...');
  for (const action of actions) {
    if (action.type === 'rename' && rename) {
      try {
        await pool.query(`RENAME TABLE \`${action.from}\` TO \`${action.to}\``);
        console.log(`✅ Renommé ${action.from} → ${action.to}`);
      } catch (err) {
        console.error(`❌ Échec renommage ${action.from} → ${action.to} :`, err.message);
      }
    } else if (action.type === 'drop' && drop) {
      for (const target of action.targets) {
        try {
          await pool.query(`DROP TABLE \`${target}\``);
          console.log(`✅ Table supprimée : ${target}`);
        } catch (err) {
          console.error(`❌ Échec suppression ${target} :`, err.message);
        }
      }
    } else {
      console.log(`⚠️  Action ignorée : ${JSON.stringify(action)} (active --rename ou --drop)`);
    }
  }

  console.log('\n✅ Nettoyage terminé. Vérifie ensuite le schéma et relance l’import si nécessaire.');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
