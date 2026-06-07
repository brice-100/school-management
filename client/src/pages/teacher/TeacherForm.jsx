import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Upload, Eye, EyeOff, X, Check } from 'lucide-react'
import { createTeacher, updateTeacher, getTeacher } from '../../services/teacherService'
import { getClasses }  from '../../services/classService'
import { getMatieres } from '../../services/matiereService'
import toast from 'react-hot-toast'

const schema = z.object({
  nom:           z.string().min(2, 'Minimum 2 caractères'),
  prenom:        z.string().min(2, 'Minimum 2 caractères'),
  username:      z.string().min(3, 'Username (ex: email) requis'),
  mobile:        z.string().min(8, 'Téléphone invalide'),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  mot_de_passe:  z.string().min(6, 'Minimum 6 caractères').optional().or(z.literal('')),
  classe_id:     z.string().optional(),
})

export default function TeacherForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [classes,         setClasses]         = useState([])
  const [matieres,        setMatieres]        = useState([])
  const [selectedCours,   setSelectedCours]   = useState([]) // tableau d'idCours sélectionnés
  const [preview,         setPreview]         = useState(null)
  const [photoFile,       setPhotoFile]       = useState(null)
  const [showPwd,         setShowPwd]         = useState(false)
  const [loading,         setLoading]         = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  // Charger classes + matières
  useEffect(() => {
    Promise.all([getClasses(), getMatieres()])
      .then(([c, m]) => {
        setClasses(c.data.data  || [])
        setMatieres(m.data.data || [])
      })
      .catch(() => toast.error('Erreur chargement données.'))
  }, [])

  // Pré-remplir si édition
  useEffect(() => {
    if (!isEdit) return
    getTeacher(id)
      .then(({ data }) => {
        const t = data.data
        reset({
          nom:           t.nom           || '',
          prenom:        t.prenom        || '',
          username:      t.username      || '',
          mobile:        t.mobile        || '',
          dateNaissance: t.dateNaissance?.split('T')[0] || '',
          lieuNaissance: t.lieuNaissance || '',
          classe_id:     t.classe_id     ? String(t.classe_id) : '',
          mot_de_passe:  '',
        })
        // Pré-sélectionner les matières existantes
        if (t.matieres && t.matieres.length > 0) {
          setSelectedCours(t.matieres.map(m => String(m.idCours)))
        } else if (t.idCours) {
          setSelectedCours([String(t.idCours)])
        }
        if (t.photo) {
          setPreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}/${t.photo}`)
        }
      })
      .catch(() => toast.error('Erreur chargement enseignant.'))
  }, [id, isEdit, reset])

  // Basculer une matière dans la sélection
  const toggleMatiere = (idCours) => {
    const s = String(idCours)
    setSelectedCours(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const fd = new FormData()

      // Champs texte
      Object.entries(values).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          fd.append(k, v)
        }
      })

      // Photo
      if (photoFile) fd.append('photo', photoFile)

      // Matières — toujours envoyer idCours (même vide) pour remplacer la liste côté serveur
      if (selectedCours.length > 0) {
        selectedCours.forEach(c => fd.append('idCours', c))
      } else {
        fd.append('idCours', '')
      }

      if (isEdit) {
        await updateTeacher(id, fd)
        toast.success('Enseignant mis à jour !', { duration: 2000 })
      } else {
        await createTeacher(fd)
        toast.success('Enseignant créé !', { duration: 2000 })
      }
      navigate('/teachers')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur de sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, error, children }) => (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {isEdit ? "Modifier l'enseignant" : 'Ajouter un enseignant'}
          </h1>
          <p className="text-gray-500 text-sm">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Photo */}
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Photo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden
              flex items-center justify-center border-2 border-dashed border-gray-200 shrink-0">
              {preview
                ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                : <span className="text-3xl text-gray-300">👤</span>
              }
            </div>
            <label className="btn-secondary cursor-pointer">
              <Upload size={14} />
              {preview ? 'Changer' : 'Choisir une photo'}
              <input type="file" accept="image/*" hidden
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)) }
                }}
              />
            </label>
          </div>
        </div>

        {/* Infos personnelles */}
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Informations personnelles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom *" error={errors.prenom?.message}>
              <input {...register('prenom')} placeholder="Ex: Jean" className="input-field" />
            </Field>
            <Field label="Nom *" error={errors.nom?.message}>
              <input {...register('nom')} placeholder="Ex: Dupont" className="input-field" />
            </Field>
            <Field label="Identifiant (Username/Email) *" error={errors.username?.message}>
              <input {...register('username')} type="text"
                placeholder="jean.dupont" className="input-field" />
            </Field>
            <Field label="Téléphone (Mobile) *" error={errors.mobile?.message}>
              <input {...register('mobile')} placeholder="6XX XXX XXX" className="input-field" />
            </Field>
            <Field label="Date de naissance" error={errors.dateNaissance?.message}>
              <input {...register('dateNaissance')} type="date" className="input-field" />
            </Field>
            <Field label="Lieu de naissance" error={errors.lieuNaissance?.message}>
              <input {...register('lieuNaissance')} placeholder="Paris" className="input-field" />
            </Field>
          </div>
        </div>

        {/* Affectation */}
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Affectation
          </h2>
          <div className="space-y-4">
            {/* Classe */}
            <Field label="Classe assignée (Titulaire)">
              <select {...register('classe_id')} className="select-field">
                <option value="">— Aucune —</option>
                {classes.map(c => (
                  <option key={c.idClasse} value={String(c.idClasse)}>{c.libelle}</option>
                ))}
              </select>
            </Field>

            {/* Multi-matières */}
            <div>
              <label className="form-label">
                Matières enseignées
                {selectedCours.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {selectedCours.length} sélectionnée{selectedCours.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>

              {matieres.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                  Aucune matière disponible. Ajoutez d'abord des matières dans la section Matières.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {matieres.map(m => {
                    const mid = String(m.idCours || m.id)
                    const isSelected = selectedCours.includes(mid)
                    return (
                      <button
                        key={mid}
                        type="button"
                        onClick={() => toggleMatiere(mid)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                          border transition-all duration-150 cursor-pointer select-none
                          ${isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                      >
                        {isSelected && <Check size={13} />}
                        {m.libelle || m.nom}
                        {isSelected && (
                          <X size={12} className="opacity-70 hover:opacity-100" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {selectedCours.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCours([])}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                >
                  Tout désélectionner
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mot de passe - Uniquement à la création */}
        {!isEdit && (
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Mot de passe *
            </h2>
            <Field label="Mot de passe" error={errors.mot_de_passe?.message}>
              <div className="relative">
                <input
                  {...register('mot_de_passe')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </div>
        )}

        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary min-w-36">
            {loading
              ? 'Enregistrement...'
              : isEdit ? 'Mettre à jour' : "Créer l'enseignant"
            }
          </button>
        </div>
      </form>
    </div>
  )
}