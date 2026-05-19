require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('🔄 Démarrage de la migration de la base de données...');

  try {
    // 1. Ajouter la colonne 'status' dans la table Rapport
    try {
      await pool.query("ALTER TABLE `Rapport` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'Enregistré'");
      console.log("✅ Colonne 'status' ajoutée à la table 'Rapport'.");
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("ℹ️ La colonne 'status' existe déjà dans la table 'Rapport'.");
      } else {
        throw err;
      }
    }

    // 2. Créer la table Devoirs
    const createDevoirsTable = `
      CREATE TABLE IF NOT EXISTS \`Devoirs\` (
        \`idDevoir\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`titre\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`idCours\` INT UNSIGNED NOT NULL,
        \`idSalle\` INT UNSIGNED NOT NULL,
        \`idPers\` INT UNSIGNED NOT NULL,
        \`date_rendu\` DATE NULL,
        \`urlDoc\` VARCHAR(255) NULL,
        \`created_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`idDevoir\`),
        CONSTRAINT \`fk_devoirs_cours\` FOREIGN KEY (\`idCours\`) REFERENCES \`Cours\` (\`idCours\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_devoirs_salle\` FOREIGN KEY (\`idSalle\`) REFERENCES \`Salle\` (\`idSalle\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_devoirs_pers\` FOREIGN KEY (\`idPers\`) REFERENCES \`Personne\` (\`idPers\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(createDevoirsTable);
    console.log("✅ Table 'Devoirs' vérifiée/créée.");

    // 3. Créer la table MessagesParent
    const createMessagesParentTable = `
      CREATE TABLE IF NOT EXISTS \`MessagesParent\` (
        \`idMsg\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`idParent\` INT UNSIGNED NOT NULL,
        \`idExp\` INT UNSIGNED NOT NULL,
        \`idDest\` INT UNSIGNED NULL,
        \`destType\` VARCHAR(20) NOT NULL,
        \`objet\` VARCHAR(255) NOT NULL,
        \`contenu\` TEXT NOT NULL,
        \`reponse\` TEXT NULL,
        \`idPersReponse\` INT UNSIGNED NULL,
        \`lu\` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL,
        \`repondu_at\` DATETIME NULL,
        PRIMARY KEY (\`idMsg\`),
        CONSTRAINT \`fk_msg_parent_idparent\` FOREIGN KEY (\`idParent\`) REFERENCES \`Parents\` (\`idParent\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(createMessagesParentTable);
    console.log("✅ Table 'MessagesParent' vérifiée/créée.");

    console.log('🎉 Migration terminée avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
