import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

export default function JoinTripModal({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Enter an invite code.');
    setLoading(true);
    try {
      const res = await api.post('/trips/join', { inviteCode: code.trim() });
      toast.success(`Joined "${res.data.trip.name}"! 🎉`);
      onJoined(res.data.trip);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid or expired code.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Join a Trip" onClose={onClose}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔗</div>
        <p className="text-sm text-white/40">
          Ask your trip host for the invite code.<br />
          Format: <code className="text-violet-400 font-mono font-bold">TRP-XXXX</code>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          className="input font-mono text-2xl tracking-[0.3em] text-center font-bold py-4"
          style={{ color: '#bf654d' }}
          placeholder="TRP-XXXX"
          maxLength={8}
          autoFocus
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Joining...' : 'Join Trip →'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
