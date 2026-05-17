import { useState, useEffect } from 'react'
import { Check, X, UserX, UserCheck, Trash2, Search } from 'lucide-react'
import { getUsers, updateStatut, deleteUser } from '../../services/userService'
import { filterDeleted } from '../../services/deleteConfig'
import toast from 'react-hot-toast'

const STATUT_STYLE = {
  en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
  actif:      { label: 'Actif',      cls: 'bg-emerald-50 text-emerald-700' },
  suspendu:   { label: 'Suspendu',   cls: 'bg-red-50 text-red-700' },
}

const ROLE_STYLE = {
  teacher: { label: 'Enseignant', cls: 'bg-blue-50 text-blue-700' },
  parent:  { label: 'Parent',     cls: 'bg-purple-50 text-purple-700' },
}

export default function UserManagement() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole]     = useState('')
  const [filterStatut, setFilterStatut] = useState('en_attente')
  const [search, setSearch] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await getUsers({ role: filterRole, statut: filterStatut, search })
      setUsers(filterDeleted(data.data || []))
      // Compter les en attente pour le badge
      const pending = data.data.filter(u => u.statut === 'en_attente').length
      setPendingCount(pending)
    } catch { toast.error('Erreur chargement.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [filterRole, filterStatut, search])

  const handleStatut = async (id, statut, name) => {
    try {
      await updateStatut(id, statut)
      const labels = { actif: 'validé', suspendu: 'suspendu', en_attente: 'remis en attente' }
      toast.success(`Compte de ${name} ${labels[statut]} !`)
      fetchUsers()
    } catch { toast.error('Erreur mise à jour.') }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${name} ?`)) return
    try {
      await deleteUser(id)
      toast.success(`Compte de ${name} supprimé.`)
      fetchUsers()
    } catch { toast.error('Erreur suppression.') }
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Gestion des comptes
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Validez, suspendez ou supprimez les comptes enseignants et parents
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-700 text-sm font-medium">
              {pendingCount} compte{pendingCount > 1 ? 's' : ''} en attente
            </span>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)} className="select-field w-44">
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="actif">Actifs</option>
          <option value="suspendu">Suspendus</option>
        </select>
        <select value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)} className="select-field w-40">
          <option value="">Tous les rôles</option>
          <option value="teacher">Enseignants</option>
          <option value="parent">Parents</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center text-gray-400">
            <UserCheck size={36} className="text-gray-300 mb-3" />
            <p className="text-sm">Aucun compte trouvé avec ces filtres.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Utilisateur', 'Rôle', 'Téléphone', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const s = STATUT_STYLE[u.statut] || STATUT_STYLE.en_attente
                const r = ROLE_STYLE[u.role]
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                          ${u.role === 'teacher' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.prenom} {u.nom}</p>
                          <p className="text-gray-400 text-xs">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${r?.cls}`}>{r?.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.telephone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {u.statut === 'en_attente' && (
                          <button
                            onClick={() => handleStatut(u.id, 'actif', `${u.prenom} ${u.nom}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            <Check size={13} /> Valider
                          </button>
                        )}
                        {u.statut === 'actif' && (
                          <button
                            onClick={() => handleStatut(u.id, 'suspendu', `${u.prenom} ${u.nom}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            <UserX size={13} /> Suspendre
                          </button>
                        )}
                        {u.statut === 'suspendu' && (
                          <button
                            onClick={() => handleStatut(u.id, 'actif', `${u.prenom} ${u.nom}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            <UserCheck size={13} /> Réactiver
                          </button>
                        )}
                        {u.statut === 'en_attente' && (
                          <button
                            onClick={() => handleStatut(u.id, 'suspendu', `${u.prenom} ${u.nom}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
                          >
                            <X size={13} /> Refuser
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)}
                          className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}