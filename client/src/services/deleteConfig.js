/**
 * ─────────────────────────────────────────────────────────────────
 * deleteConfig.js — Configuration centrale des suppressions
 * ─────────────────────────────────────────────────────────────────
 *
 * isDelete = true  → soft delete (marquage côté BDD, jamais supprimé)
 * isDelete = false → hard delete (DELETE HTTP classique)
 *
 * ⚠️  METTRE À JOUR ces deux valeurs dès confirmation backend :
 *
 *   DELETE_METHOD :
 *     'patch'  → PATCH /:id  { isDelete: true }
 *     'put'    → PUT  /:id   { isDelete: true }
 *     'delete' → DELETE /:id (le backend gère isDelete lui-même)
 *
 *   BACKEND_FILTERS_ISDELETE :
 *     true  → le backend renvoie déjà les items avec isDelete=false
 *             (le frontend n'a rien à filtrer)
 *     false → le frontend doit filtrer les items où isDelete=true
 */

export const DELETE_METHOD = 'delete'           // ← À confirmer avec le backend
export const BACKEND_FILTERS_ISDELETE = true   // ← À confirmer avec le backend

/**
 * softDelete(apiInstance, endpoint, id)
 *
 * Appelle la bonne méthode HTTP selon DELETE_METHOD.
 *
 * @param {object} api         - instance axios (import api from './api')
 * @param {string} endpoint    - ex: '/eleves', '/classes', '/cours'
 * @param {string|number} id   - identifiant de la ressource
 * @returns {Promise}
 *
 * Exemples d'utilisation dans un service :
 *   export const deleteStudent = (id) => softDelete(api, '/eleves', id)
 *   export const deleteClass   = (id) => softDelete(api, '/classes', id)
 */
export function softDelete(api, endpoint, id) {
  switch (DELETE_METHOD) {
    case 'patch':
      return api.patch(`${endpoint}/${id}`, { isDelete: true })
    case 'put':
      return api.put(`${endpoint}/${id}`, { isDelete: true })
    case 'delete':
    default:
      return api.delete(`${endpoint}/${id}`)
  }
}

/**
 * filterDeleted(items)
 *
 * Filtre côté frontend les items supprimés (isDelete=true).
 * Ne fait rien si BACKEND_FILTERS_ISDELETE=true.
 *
 * @param {Array} items - tableau de données retourné par l'API
 * @returns {Array}
 *
 * Exemple :
 *   const students = filterDeleted(data.eleves)
 */
export function filterDeleted(items) {
  if (!Array.isArray(items)) return items
  if (BACKEND_FILTERS_ISDELETE) return items
  return items.filter(item => !item.isDelete)
}