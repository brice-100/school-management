const swaggerUi   = require('swagger-ui-express');
const YAML        = require('yamljs');
const path        = require('path');

const swaggerDoc = YAML.load(
  path.join(__dirname, '..', '..', 'docs', 'swagger.yaml')
);

/**
 * Monte Swagger UI sur /api-docs.
 * @param {import('express').Application} app
 */
const mountSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'School Management API',
  }));
};

module.exports = { mountSwagger };
