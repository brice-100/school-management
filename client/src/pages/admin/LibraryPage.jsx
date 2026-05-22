// ─────────────────────────────────────────────────────────────────
// LibraryPage.jsx
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Book, X } from 'lucide-react'
import { getLivres, getLivre, createLivre, updateLivre, deleteLivre,
  getSpecialites, createSpecialite } from '../../services/libraryService'
import toast from 'react-hot-toast'

export default function LibraryPage() {
  const [livres,     setLivres]     = useState([])
  const [specialites,setSpecialites]= useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState(null)
  const [search,     setSearch]     = useState('')
  const [filterSpe,  setFilterSpe]  = useState('')
  const [form, setForm] = useState({
    titre:'', auteurs:'', prix:'', idSpecialite:'',
    edition:'', annee_parution:'', totalCopie: 1,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const fetchLivres = () => {
    setLoading(true)
    getLivres({ search, idSpecialite: filterSpe })
      .then(({ data }) => setLivres(data.livres || data.data || []))
      .catch(() => toast.error('Erreur chargement livres.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLivres() }, [search, filterSpe])
  useEffect(() => {
    getSpecialites().then(({ data }) => setSpecialites(data.specialites || data.data || []))
  }, [])

  const handleEdit = async (id) => {
    try {
      const { data } = await getLivre(id)
      const l = data.livre || data.data
      setEditId(id)
      setForm({ titre: l.titre, auteurs: l.auteurs || '', prix: l.prix,
        idSpecialite: l.idSpecialite, edition: l.edition || '',
        annee_parution: l.annee_parution?.split('T')[0] || '',
        totalCopie: l.totalCopie })
      setShowForm(true)
    } catch { toast.error('Erreur chargement.') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titre || !form.idSpecialite) return toast.error('Titre et spécialité requis.')
    try {
      if (editId) {
        await updateLivre(editId, form)
        toast.success('Livre mis à jour !')
      } else {
        await createLivre(form)
        toast.success('Livre ajouté !')
      }
      setShowForm(false); setEditId(null)
      setForm({ titre:'', auteurs:'', prix:'', idSpecialite:'', edition:'', annee_parution:'', totalCopie:1 })
      fetchLivres()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleAddSpecialite = async () => {
    const libelle = window.prompt("Nom de la nouvelle spécialité :")
    if (!libelle) return;
    try {
      const { data } = await createSpecialite({ libelle })
      toast.success('Spécialité ajoutée')
      setSpecialites(prev => [...prev, data.data])
      setForm(f => ({ ...f, idSpecialite: data.data.idSpecialite }))
    } catch (err) {
      toast.error(err.message || 'Erreur')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce livre ?')) return
    try {
      await deleteLivre(id)
      toast.success('Livre supprimé.')
      fetchLivres()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Bibliothèque</h1>
          <p className="text-gray-500 text-sm mt-0.5">{livres.length} livre(s)</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditId(null) }} className="btn-primary">
          <Plus size={16} /> Ajouter un livre
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-amber-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier le livre' : 'Nouveau livre'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Titre *</label>
              <input value={form.titre} onChange={e => set('titre', e.target.value)}
                placeholder="Titre du livre" className="input-field" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label mb-0">Spécialité *</label>
                <button type="button" onClick={handleAddSpecialite} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  + Nouvelle
                </button>
              </div>
              <select value={form.idSpecialite} onChange={e => set('idSpecialite', e.target.value)}
                className="select-field">
                <option value="">— Choisir —</option>
                {specialites.map(s => (
                  <option key={s.idSpecialite} value={s.idSpecialite}>{s.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Auteurs</label>
              <input value={form.auteurs} onChange={e => set('auteurs', e.target.value)}
                placeholder="Nom des auteurs" className="input-field" />
            </div>
            <div>
              <label className="form-label">Édition</label>
              <input value={form.edition} onChange={e => set('edition', e.target.value)}
                placeholder="Ex: 3e édition" className="input-field" />
            </div>
            <div>
              <label className="form-label">Prix (FCFA)</label>
              <input type="number" min="0" value={form.prix}
                onChange={e => set('prix', e.target.value)}
                placeholder="Ex: 5000" className="input-field" />
            </div>
            <div>
              <label className="form-label">Nombre d'exemplaires</label>
              <input type="number" min="1" value={form.totalCopie}
                onChange={e => set('totalCopie', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="form-label">Année de parution</label>
              <input type="date" value={form.annee_parution}
                onChange={e => set('annee_parution', e.target.value)}
                className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">
              {editId ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher un livre, auteur..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <select value={filterSpe} onChange={e => setFilterSpe(e.target.value)}
          className="select-field w-48">
          <option value="">Toutes les spécialités</option>
          {specialites.map(s => (
            <option key={s.idSpecialite} value={s.idSpecialite}>{s.libelle}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton w-9 h-9 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : livres.length === 0 ? (
          <div className="py-14 text-center">
            <Book size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun livre enregistré.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Titre', 'Auteurs', 'Spécialité', 'Copies', 'Prix', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {livres.map(l => (
                <tr key={l.idLivre} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center
                        justify-center text-amber-600 shrink-0">
                        <Book size={15} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{l.titre}</p>
                        {l.edition && l.edition !== 'INDEFINI' && (
                          <p className="text-xs text-gray-400">{l.edition}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {l.auteurs !== 'INDEFINI' ? l.auteurs : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-amber-50 text-amber-700">
                      {l.libelleSpecialite || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-blue-50 text-blue-700">{l.totalCopie}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {l.prix > 0 ? `${Number(l.prix).toLocaleString('fr-FR')} FCFA` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(l.idLivre)} className="btn-icon">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(l.idLivre)}
                        className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}