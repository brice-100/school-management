import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import * as classService from '../../services/classService'
import * as coursService from '../../services/coursService'
import toast from 'react-hot-toast'

// ── Table générique avec formulaire inline ────────────────────────
function RefTable({ title, items, fields, onAdd, onEdit, onDelete,
  editId, form, setForm, loading, extraActions, idKey = 'id' }) {

  const getId = (item) =>
    item[idKey] ?? item.idClasse ?? item.idCycle ?? item.idSalle ?? item.id

  return (
    <div>
      <form onSubmit={onAdd} className="flex flex-wrap gap-3 mb-5 items-end">
        {fields.map(({ key, label, placeholder, type = 'text', options }) => (
          <div key={key} className="flex-1 min-w-36">
            <label className="form-label">{label}</label>
            {options ? (
              <select value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="select-field">
                <option value="">— Choisir —</option>
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input type={type} value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="input-field" />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {editId ? <><Check size={14}/> Valider</> : <><Plus size={14}/> Ajouter</>}
        </button>
        {editId && (
          <button type="button"
            onClick={() => { onEdit(null); setForm({}) }}
            className="btn-secondary shrink-0">
            <X size={14}/>
          </button>
        )}
      </form>

      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">
            Aucun(e) {title.toLowerCase()} enregistré(e).
          </p>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {fields.map(({ label }) => (
                    <th key={label} className="text-left font-medium text-gray-500 px-5 py-3 whitespace-nowrap">{label}</th>
                  ))}
                  {extraActions && (
                    <th className="text-left font-medium text-gray-500 px-5 py-3 whitespace-nowrap">Info</th>
                  )}
                  <th className="text-right font-medium text-gray-500 px-5 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => {
                  const itemId = getId(item)
                  return (
                    <tr key={itemId}
                      className={`hover:bg-gray-50/50 transition-colors
                        ${editId === itemId ? 'bg-blue-50/40' : ''}`}>
                      {fields.map(({ key }) => (
                        <td key={key} className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{item[key] ?? '—'}</td>
                      ))}
                      {extraActions && (
                        <td className="px-5 py-3.5 whitespace-nowrap">{extraActions(item)}</td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onEdit(item)} className="btn-icon">
                            <Pencil size={14}/>
                          </button>
                          <button onClick={() => onDelete(itemId)}
                            className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onglet Salles ─────────────────────────────────────────────────
function SallesTab({ classes }) {
  const [salles,  setSalles]  = useState([])
  const [form,    setForm]    = useState({ libelle:'', position:'', surface:'', idClasse:'' })
  const [editId,  setEditId]  = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchSalles = () =>
    classService.getSalles()
      .then(({ data }) => setSalles(data.salles || data.data || []))
      .catch(() => {})

  useEffect(() => { fetchSalles() }, [])

  const handleEdit = (item) => {
    if (!item) { setEditId(null); setForm({ libelle:'', position:'', surface:'', idClasse:'' }); return }
    setEditId(item.idSalle)
    setForm({ libelle: item.libelle||'', position: item.position||'',
      surface: item.surface||'', idClasse: String(item.idClasse||'') })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.idClasse) return toast.error('Libellé et classe requis.')
    setLoading(true)
    try {
      if (editId) {
        await classService.updateSalle(editId, form)
        toast.success('Salle mise à jour !'); setEditId(null)
      } else {
        await classService.createSalle(form)
        toast.success('Salle créée !')
      }
      setForm({ libelle:'', position:'', surface:'', idClasse:'' })
      fetchSalles()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette salle ?')) return
    try { await classService.deleteSalle(id); toast.success('Salle supprimée.'); fetchSalles() }
    catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleToggle = async (salle) => {
    try {
      await classService.updateSalle(salle.idSalle, { actif: salle.actif === 1 ? 0 : 1 })
      toast.success(salle.actif === 1 ? 'Salle désactivée.' : 'Salle activée.')
      fetchSalles()
    } catch { toast.error('Erreur.') }
  }

  return (
    <RefTable
      title="Salles" items={salles} editId={editId}
      form={form} setForm={setForm} loading={loading}
      idKey="idSalle"
      fields={[
        { key:'libelle',  label:'Libellé',  placeholder:'Ex: Salle A' },
        { key:'position', label:'Position', placeholder:'Ex: Bâtiment 1, RDC' },
        { key:'surface',  label:'Surface',  placeholder:'Ex: 40 m²' },
        {
          key:'idClasse', label:'Classe',
          options: classes.map(c => ({ value: String(c.idClasse), label: c.libelle })),
        },
      ]}
      onAdd={handleSubmit} onEdit={handleEdit} onDelete={handleDelete}
      extraActions={(item) => (
        <div className="flex items-center gap-2">
          <span className={`badge ${item.actif===1
            ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {item.actif===1 ? 'Active' : 'Inactive'}
          </span>
          <button onClick={() => handleToggle(item)} className="btn-icon">
            {item.actif===1
              ? <ToggleRight size={18} className="text-emerald-500"/>
              : <ToggleLeft  size={18} className="text-gray-400"/>}
          </button>
        </div>
      )}
    />
  )
}

// ── Onglet Cours / Matières ───────────────────────────────────────
function CoursTab({ classes }) {
  const [cours,   setCours]   = useState([])
  const [form,    setForm]    = useState({ libelle:'', description:'', coefficient:'', idClasse:'' })
  const [editId,  setEditId]  = useState(null)
  const [loading, setLoading] = useState(false)

  // On charge la liste plate (une entrée par idCours) pour le CRUD
  const fetchCours = () =>
    coursService.getCours()
      .then(({ data }) => setCours(data.cours || data.data || []))
      .catch(() => {})

  useEffect(() => { fetchCours() }, [])

  const handleEdit = (item) => {
    if (!item) { setEditId(null); setForm({ libelle:'', description:'', coefficient:'', idClasse:'' }); return }
    setEditId(item.idCours)
    setForm({ libelle: item.libelle||'', description: item.description||'',
      coefficient: item.coefficient||'', idClasse: String(item.idClasse||'') })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.idClasse) return toast.error('Libellé et classe requis.')
    setLoading(true)
    try {
      if (editId) {
        await coursService.updateCours(editId, form)
        toast.success('Matière mise à jour !'); setEditId(null)
      } else {
        await coursService.createCours(form)
        toast.success('Matière créée !')
      }
      setForm({ libelle:'', description:'', coefficient:'', idClasse:'' })
      fetchCours()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette matière ?')) return
    try { await coursService.deleteCours(id); toast.success('Matière supprimée.'); fetchCours() }
    catch (err) { toast.error(err.message || 'Erreur.') }
  }

  // Grouper par libellé pour l'affichage
  const grouped = Object.values(
    cours.reduce((acc, c) => {
      const key = c.libelle?.toLowerCase().trim() || ''
      if (!acc[key]) {
        acc[key] = { ...c, _entries: [c] }
      } else {
        acc[key]._entries.push(c)
      }
      return acc
    }, {})
  ).sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''))

  const getClasseLabel = (idClasse) => {
    const c = classes.find(c => String(c.idClasse) === String(idClasse))
    return c ? c.libelle : `#${idClasse}`
  }

  return (
    <div>
      {/* Formulaire d'ajout/modification */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-5 items-end">
        {[
          { key:'libelle', label:'Libellé', placeholder:'Ex: Mathématiques' },
          { key:'coefficient', label:'Coefficient', placeholder:'Ex: 4', type:'number' },
          { key:'description', label:'Description', placeholder:'Ex: Algèbre et Géométrie' },
        ].map(({ key, label, placeholder, type='text' }) => (
          <div key={key} className="flex-1 min-w-36">
            <label className="form-label">{label}</label>
            <input type={type} value={form[key] || ''}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder} className="input-field" />
          </div>
        ))}
        <div className="flex-1 min-w-36">
          <label className="form-label">Classe</label>
          <select value={form.idClasse || ''} onChange={e => setForm(f => ({ ...f, idClasse: e.target.value }))} className="select-field">
            <option value="">— Choisir —</option>
            {classes.map(c => <option key={c.idClasse} value={String(c.idClasse)}>{c.libelle}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {editId ? <><Check size={14}/> Valider</> : <><Plus size={14}/> Ajouter</>}
        </button>
        {editId && (
          <button type="button" onClick={() => { handleEdit(null); }}  className="btn-secondary shrink-0">
            <X size={14}/>
          </button>
        )}
      </form>

      <div className="card overflow-hidden">
        {grouped.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Aucune matière enregistrée.</p>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Libellé', 'Coefficient', 'Description', 'Classes concernées', 'Actions'].map(h => (
                    <th key={h} className="text-left font-medium text-gray-500 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grouped.map(group => (
                  <tr key={group.libelle} className={`hover:bg-gray-50/50 transition-colors ${editId && group._entries.some(e => e.idCours === editId) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{group.libelle}</td>
                    <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{group.coefficient ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{group.description || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {group._entries.map(entry => (
                          <span key={entry.idCours} className="badge bg-blue-50 text-blue-700 text-xs">
                            {getClasseLabel(entry.idClasse)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Modifier : on édite chaque entrée individuellement via un sous-menu */}
                        {group._entries.length === 1 ? (
                          <>
                            <button onClick={() => handleEdit(group._entries[0])} className="btn-icon" title="Modifier">
                              <Pencil size={14}/>
                            </button>
                            <button onClick={() => handleDelete(group._entries[0].idCours)}
                              className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600" title="Supprimer">
                              <Trash2 size={14}/>
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {group._entries.map(entry => (
                              <div key={entry.idCours} className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 w-20 truncate">{getClasseLabel(entry.idClasse)}</span>
                                <button onClick={() => handleEdit(entry)} className="btn-icon p-1" title={`Modifier ${getClasseLabel(entry.idClasse)}`}>
                                  <Pencil size={12}/>
                                </button>
                                <button onClick={() => handleDelete(entry.idCours)}
                                  className="btn-icon p-1 text-red-400 hover:bg-red-50 hover:text-red-600" title={`Supprimer ${getClasseLabel(entry.idClasse)}`}>
                                  <Trash2 size={12}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


// ── Page principale ───────────────────────────────────────────────
export default function ClassesPage() {
  const [tab, setTab] = useState('classes')

  const [classes,   setClasses]   = useState([])
  const [classForm, setClassForm] = useState({ libelle:'', idCycle:'', pension:'', inscription:'' })
  const [classEdit, setClassEdit] = useState(null)

  const [cycles,    setCycles]    = useState([])
  const [cycleForm, setCycleForm] = useState({ libelle:'', description:'' })
  const [cycleEdit, setCycleEdit] = useState(null)

  const [loading, setLoading] = useState(false)

  const fetchClasses = () =>
    classService.getClasses()
      .then(({ data }) => setClasses(data.classes || data.data || []))
      .catch(() => {})

  const fetchCycles = () =>
    classService.getCycles()
      .then(({ data }) => setCycles(data.cycles || data.data || []))
      .catch(() => {})

  useEffect(() => { fetchClasses(); fetchCycles() }, [])

  // ── CRUD Classes ─────────────────────────────────────────────
  const handleClassSubmit = async (e) => {
    e.preventDefault()
    if (!classForm.libelle) return toast.error('Le libellé est requis.')
    setLoading(true)
    try {
      if (classEdit) {
        await classService.updateClass(classEdit, classForm)
        toast.success('Classe mise à jour !'); setClassEdit(null)
      } else {
        await classService.createClass(classForm)
        toast.success('Classe créée !')
      }
      setClassForm({ libelle:'', idCycle:'' }); fetchClasses()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setLoading(false) }
  }

  const handleClassEdit = (item) => {
    if (!item) { setClassEdit(null); setClassForm({ libelle:'', idCycle:'', pension:'', inscription:'' }); return }
    setClassEdit(item.idClasse)
    setClassForm({
      libelle: item.libelle || '',
      idCycle: String(item.idCycle || ''),
      pension: item.pension !== null && item.pension !== undefined ? String(item.pension) : '',
      inscription: item.inscription !== null && item.inscription !== undefined ? String(item.inscription) : '',
    })
  }

  const handleClassDelete = async (id) => {
    if (!window.confirm('Supprimer cette classe ?')) return
    try { await classService.deleteClass(id); toast.success('Classe supprimée.'); fetchClasses() }
    catch (err) { toast.error(err.message || 'Erreur.') }
  }

  // ── CRUD Cycles ───────────────────────────────────────────────
  const handleCycleSubmit = async (e) => {
    e.preventDefault()
    if (!cycleForm.libelle) return toast.error('Le libellé est requis.')
    setLoading(true)
    try {
      if (cycleEdit) {
        await classService.updateCycle(cycleEdit, cycleForm)
        toast.success('Cycle mis à jour !'); setCycleEdit(null)
      } else {
        await classService.createCycle(cycleForm)
        toast.success('Cycle créé !')
      }
      setCycleForm({ libelle:'', description:'' }); fetchCycles()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setLoading(false) }
  }

  const handleCycleEdit = (item) => {
    if (!item) { setCycleEdit(null); setCycleForm({ libelle:'', description:'' }); return }
    setCycleEdit(item.idCycle)
    setCycleForm({ libelle: item.libelle||'', description: item.description||'' })
  }

  const handleCycleDelete = async (id) => {
    if (!window.confirm('Supprimer ce cycle ? Les classes liées seront affectées.')) return
    try { await classService.deleteCycle(id); toast.success('Cycle supprimé.'); fetchCycles() }
    catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const TABS = [
    { key:'classes', label:`Classes (${classes.length})` },
    { key:'cycles',  label:`Cycles (${cycles.length})`   },
    { key:'salles',  label:'Salles'                      },
    { key:'matieres', label:'Matières (Cours)'           },
  ]

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Configuration scolaire
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gérez les classes, cycles et salles de l'établissement
        </p>
      </div>

      {cycles.length === 0 && (
        <div className="card p-4 mb-5 border-l-4 border-amber-400 bg-amber-50">
          <p className="text-amber-800 text-sm font-medium">⚠️ Aucun cycle enregistré</p>
          <p className="text-amber-700 text-xs mt-1">
            Commencez par l'onglet <strong>Cycles</strong> avant d'ajouter des classes.
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'classes' && (
        <RefTable
          title="Classes" items={classes} editId={classEdit}
          form={classForm} setForm={setClassForm} loading={loading}
          idKey="idClasse"
          fields={[
            { key:'libelle', label:'Libellé', placeholder:'Ex: CP, CE1, GS…' },
            {
              key:'idCycle', label:'Cycle',
              options: cycles.map(c => ({ value: String(c.idCycle), label: c.libelle })),
            },
            { key:'pension', label:'Pension (FCFA/tranche)', placeholder:'Ex: 25000', type:'number' },
            { key:'inscription', label:'Inscription (FCFA)', placeholder:'Ex: 50000', type:'number' },
          ]}
          onAdd={handleClassSubmit} onEdit={handleClassEdit} onDelete={handleClassDelete}
          extraActions={(item) => {
            const cycle = cycles.find(c => String(c.idCycle) === String(item.idCycle))
            const pension = item.pension ?? item.pension_effective
            const inscription = item.inscription ?? item.inscription_effective
            return (
              <div className="flex flex-col gap-0.5">
                {cycle && <span className="badge bg-purple-50 text-purple-700">{cycle.libelle}</span>}
                {pension != null
                  ? <span className="text-xs text-emerald-700 font-medium">
                      Pension : {Number(pension).toLocaleString('fr-FR')} FCFA
                    </span>
                  : <span className="text-xs text-amber-600">Pension : non définie</span>
                }
                {inscription != null
                  ? <span className="text-xs text-blue-700">
                      Inscription : {Number(inscription).toLocaleString('fr-FR')} FCFA
                    </span>
                  : <span className="text-xs text-gray-400">Inscription : non définie</span>
                }
              </div>
            )
          }}
        />
      )}

      {tab === 'cycles' && (
        <RefTable
          title="Cycles" items={cycles} editId={cycleEdit}
          form={cycleForm} setForm={setCycleForm} loading={loading}
          idKey="idCycle"
          fields={[
            { key:'libelle',     label:'Libellé',     placeholder:'Ex: Maternelle, Primaire' },
            { key:'description', label:'Description', placeholder:'Ex: Petite/Moyenne/Grande section' },
          ]}
          onAdd={handleCycleSubmit} onEdit={handleCycleEdit} onDelete={handleCycleDelete}
          extraActions={(item) => (
            <span className="badge bg-blue-50 text-blue-700">
              {classes.filter(c => String(c.idCycle) === String(item.idCycle)).length} classe(s)
            </span>
          )}
        />
      )}

      {tab === 'salles' && <SallesTab classes={classes} />}

      {tab === 'matieres' && <CoursTab classes={classes} />}
    </div>
  )
}