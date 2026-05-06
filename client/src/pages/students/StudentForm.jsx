import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, UserCircle } from 'lucide-react';
import { createStudent, updateStudent, getStudent } from '../../services/studentService';
import { getClasses } from '../../services/classService';
import { getParents } from '../../services/parentService';
import toast from 'react-hot-toast';

const schema = z.object({
  nom: z.string().min(2, 'Minimum 2 caractères'),
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  sexe: z.string().optional(),
  langue: z.string().optional(),
  classe_id: z.string().optional(),
  parent_id: z.string().optional(),
});

function FieldError({ msg }) {
  return msg ? <p className="error-msg">{msg}</p> : null;
}

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    Promise.all([getClasses(), getParents()])
      .then(([c, p]) => { setClasses(c.data.data); setParents(p.data.data); });

    if (isEdit) {
      getStudent(id).then(({ data }) => {
        const s = data.data;
        reset({
          nom: s.nom, prenom: s.prenom,
          dateNaissance: s.dateNaissance?.split('T')[0] || '',
          lieuNaissance: s.lieuNaissance || '',
          sexe: s.sexe?.toString() || '0',
          langue: s.langue || '',
          classe_id: s.classe_id?.toString() || '',
          parent_id: s.parent_id?.toString() || '',
        });
        if (s.photo) setPreview(`${import.meta.env.VITE_API_URL.replace('/api','')}/${s.photo}`);
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      isEdit ? await updateStudent(id, fd) : await createStudent(fd);
      toast.success(isEdit ? 'Élève mis à jour !' : 'Élève inscrit !');
      navigate('/students');
    } catch (err) {
      toast.error(err.message || 'Erreur de sauvegarde.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {isEdit ? "Modifier l'élève" : "Inscrire un élève"}
          </h1>
          <p className="text-gray-500 text-sm">Remplissez les informations ci-dessous</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo */}
        <div className="card p-6">
          <h2 className="font-medium text-gray-700 mb-4 text-sm uppercase tracking-wide">Photo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
              {preview
                ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                : <UserCircle size={32} className="text-gray-300" />
              }
            </div>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload size={15} />
              {preview ? 'Changer la photo' : 'Choisir une photo'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)); }
                }}
              />
            </label>
          </div>
        </div>

        {/* Infos */}
        <div className="card p-6">
          <h2 className="font-medium text-gray-700 mb-4 text-sm uppercase tracking-wide">Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prénom *</label>
              <input {...register('prenom')} placeholder="Marie" className="input-field" />
              <FieldError msg={errors.prenom?.message} />
            </div>
            <div>
              <label className="form-label">Nom *</label>
              <input {...register('nom')} placeholder="Dupont" className="input-field" />
              <FieldError msg={errors.nom?.message} />
            </div>
            <div>
              <label className="form-label">Date de naissance</label>
              <input type="date" {...register('dateNaissance')} className="input-field" />
            </div>
            <div>
              <label className="form-label">Lieu de naissance</label>
              <input {...register('lieuNaissance')} placeholder="Ex: Paris" className="input-field" />
            </div>
            <div>
              <label className="form-label">Sexe</label>
              <select {...register('sexe')} className="select-field">
                <option value="0">Fille</option>
                <option value="1">Garçon</option>
                <option value="2">Autres</option>
              </select>
            </div>
            <div>
              <label className="form-label">Langue</label>
              <input {...register('langue')} placeholder="Ex: Français" className="input-field" />
            </div>
            <div>
              <label className="form-label">Classe</label>
              <select {...register('classe_id')} className="select-field">
                <option value="">— Choisir —</option>
                {classes.map((c) => <option key={c.idClasse} value={String(c.idClasse)}>{c.libelle}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Parent associé</label>
              <select {...register('parent_id')} className="select-field">
                <option value="">— Aucun —</option>
                {parents.map((p) => <option key={p.idParent} value={String(p.idPers)}>{p.prenom} {p.nom} — {p.mobile}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary min-w-32">
            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : "Inscrire l'élève"}
          </button>
        </div>
      </form>
    </div>
  );
}