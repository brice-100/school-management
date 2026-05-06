import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Usage: <ReferenceManager title="Classes" service={classService} fields={[{key:'nom',label:'Nom'},{key:'niveau',label:'Niveau'}]} />
export default function ReferenceManager({ title, service, fields }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await service.getAll();
      setItems(data.data);
    } catch { toast.error(`Erreur chargement ${title}`); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await service.update(editId, form);
        toast.success(`${title.slice(0,-1)} mis à jour !`);
      } else {
        await service.create(form);
        toast.success(`${title.slice(0,-1)} créé !`);
      }
      setForm({});
      setEditId(null);
      fetchItems();
    } catch (err) {
      toast.error(err.message || 'Erreur.');
    } finally { setLoading(false); }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    const f = {};
    fields.forEach(({ key }) => { f[key] = item[key] || ''; });
    setForm(f);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await service.delete(id);
      toast.success('Supprimé.');
      fetchItems();
    } catch (err) { toast.error(err.message || 'Erreur suppression.'); }
  };

  return (
    <div className="reference-manager">
      <h2>{title}</h2>

      <form onSubmit={handleSubmit} className="inline-form">
        {fields.map(({ key, label, type = 'text' }) => (
          <input
            key={key}
            type={type}
            placeholder={label}
            value={form[key] || ''}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
        ))}
        <button type="submit" className="btn-primary" disabled={loading}>
          {editId ? 'Mettre à jour' : `Ajouter`}
        </button>
        {editId && (
          <button type="button" onClick={() => { setEditId(null); setForm({}); }} className="btn-secondary">
            Annuler
          </button>
        )}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            {fields.map(({ label }) => <th key={label}>{label}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {fields.map(({ key }) => <td key={key}>{item[key] || '—'}</td>)}
              <td>
                <button onClick={() => handleEdit(item)} className="btn-edit">Modifier</button>
                <button onClick={() => handleDelete(item.id)} className="btn-delete">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}