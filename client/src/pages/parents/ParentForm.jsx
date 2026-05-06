import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload } from 'lucide-react'
import { createParent, updateParent, getParent } from '../../services/parentService'
import { getStudents } from '../../services/studentService'
import toast from 'react-hot-toast'

const schema = z.object({
  nom: z.string().min(2, 'Minimum 2 caractères'),
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  mobile: z.string().min(8, 'Téléphone invalide'),
  username: z.string().min(3, 'Username (ex: email) requis'),
  matricule: z.string().min(1, 'Veuillez sélectionner un élève'),
})

export default function ParentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    getStudents().then(({ data }) => setStudents(data.eleves || data.data || []));

    if (isEdit) {
      getParent(id).then(({ data }) => {
        const p = data.data
        reset({ nom: p.nom, prenom: p.prenom, mobile: p.mobile, username: p.username || '', matricule: String(p.matricule || '') })
        if (p.photo) setPreview(`${import.meta.env.VITE_API_URL.replace('/api','')}/${p.photo}`)
      })
    }
  }, [id, isEdit, reset])

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (photoFile) fd.append('photo', photoFile)
      if (isEdit) { await updateParent(id, fd) } else { await createParent(fd) }
      toast.success(isEdit ? 'Parent mis à jour !' : 'Parent ajouté !')
      navigate('/parents')
    } catch (err) {
      toast.error(err.message || 'Erreur de sauvegarde.')
    } finally { setLoading(false) }
  }

  return (
    <div className="page-container max-w-xl">
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => navigate(-1)} className="btn-icon"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {isEdit ? 'Modifier le parent' : 'Ajouter un parent'}
          </h1>
          <p className="text-gray-500 text-sm">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Photo (optionnel)</h2>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200 shrink-0">
              {preview ? <img src={preview} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl text-gray-300">👤</span>}
            </div>
            <label className="btn-secondary cursor-pointer text-sm">
              <Upload size={13} /> Choisir une photo
              <input type="file" accept="image/*" hidden
                onChange={(e) => { const f = e.target.files[0]; if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)) } }} />
            </label>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'prenom', label: 'Prénom *', placeholder: 'Marie' },
              { key: 'nom', label: 'Nom *', placeholder: 'Dupont' },
              { key: 'mobile', label: 'Téléphone (Mobile) *', placeholder: '6XX XXX XXX' },
              { key: 'username', label: 'Identifiant (Username/Email) *', placeholder: 'marie.dupont' },
            ].map(({ key, label, placeholder, type = 'text' }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input {...register(key)} type={type} placeholder={placeholder} className="input-field" />
                {errors[key] && <p className="error-msg">{errors[key].message}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="form-label">Enfant (Élève associé) *</label>
              <select {...register('matricule')} className="select-field">
                <option value="">— Sélectionner un élève —</option>
                {students.map(s => (
                  <option key={s.matricule || s.id} value={String(s.matricule || s.id)}>
                    {s.prenom} {s.nom} ({s.classe_nom || 'Sans classe'})
                  </option>
                ))}
              </select>
              {errors.matricule && <p className="error-msg">{errors.matricule.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary min-w-32">
            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Ajouter le parent'}
          </button>
        </div>
      </form>
    </div>
  )
}