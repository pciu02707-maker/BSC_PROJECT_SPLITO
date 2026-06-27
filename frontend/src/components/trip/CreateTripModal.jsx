import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const COLORS = ['#bf654d','#ec4899','#f97316','#5f7e44','#6f8c51','#d63f3f','#bf654d','#14b8a6'];
const CURRENCIES = ['BDT','USD','EUR','GBP','INR','SGD','AUD','JPY'];

export default function CreateTripModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', destination:'', currency:'BDT', coverColor:'#bf654d', startDate:'', endDate:'' });
  const [loading, setLoading] = useState(false);
  const h = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Trip name is required.');
    setLoading(true);
    try {
      const res = await api.post('/trips', form);
      toast.success(`"${form.name}" created! 🧳`);
      onCreated(res.data.trip);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Create a New Trip" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="label">Trip Name *</label><input name="name" value={form.name} onChange={h} className="input" placeholder="Cox's Bazar 2025" /></div>
        <div><label className="label">Destination</label><input name="destination" value={form.destination} onChange={h} className="input" placeholder="Cox's Bazar, Bangladesh" /></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start Date</label><input type="date" name="startDate" value={form.startDate} onChange={h} className="input" /></div>
          <div><label className="label">End Date</label><input type="date" name="endDate" value={form.endDate} onChange={h} className="input" /></div>
        </div>
        <div>
          <label className="label">Currency</label>
          <select name="currency" value={form.currency} onChange={h} className="input">
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cover Color</label>
          <div className="flex gap-2.5 mt-1">
            {COLORS.map(c => (
              <button type="button" key={c} onClick={() => setForm({...form, coverColor: c})}
                className="w-8 h-8 rounded-lg transition-all duration-150 hover:scale-110"
                style={{ background: c, boxShadow: form.coverColor === c ? `0 0 0 2px #13131f, 0 0 0 4px ${c}` : 'none' }} />
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create Trip 🧳'}</button>
        </div>
      </form>
    </Modal>
  );
}
