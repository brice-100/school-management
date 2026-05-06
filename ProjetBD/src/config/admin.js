/**
 * Credentials de l'admin root par défaut.
 * Ces valeurs sont lues depuis les variables d'environnement.
 * Ne jamais mettre de secrets en dur ici en production.
 */
const adminDefaults = {
  username: process.env.ADMIN_DEFAULT_USERNAME,
  password: process.env.ADMIN_DEFAULT_PASSWORD,
  nom:      'Root',
  typeAdmin: 0,   // 0 = root
  actif:    1,
};

module.exports = adminDefaults;
