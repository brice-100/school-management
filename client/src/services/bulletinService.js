import api from './api'

export const getBulletinData = (student_id, params) =>
  api.get(`/bulletins/${student_id}`, { params })

// Téléchargement PDF — ouvre dans un nouvel onglet
export const downloadBulletinPDF = (student_id, trimestre, annee_scolaire) => {
  const token = localStorage.getItem('token')
  const url   = `${import.meta.env.VITE_API_URL}/bulletins/${student_id}/pdf`
               + `?trimestre=${trimestre}&annee_scolaire=${annee_scolaire}`
  // Utiliser fetch pour envoyer le token
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const link    = document.createElement('a')
      link.href     = URL.createObjectURL(blob)
      link.download = `bulletin_T${trimestre}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    })
}