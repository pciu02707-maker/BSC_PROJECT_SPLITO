import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function RecycleBinModal({ onClose, onTripRestored }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores tripId of currently processing action
  const [confirm, setConfirm] = useState(null); // { tripId, tripName }

  const fetchTrash = async () => {
    try {
      const res = await api.get('/trips/trash');
      setTrips(res.data.trips);
    } catch (err) {
      toast.error('Failed to load Recycle Bin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (tripId) => {
    setActionLoading(tripId);
    try {
      await api.patch(`/trips/${tripId}/restore`);
      toast.success('Trip restored successfully! 🎉');
      onTripRestored(); // Refresh main dashboard list
      fetchTrash(); // Refresh trash list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (tripId) => {
    setActionLoading(tripId);
    setConfirm(null);
    try {
      await api.delete(`/trips/${tripId}`);
      toast.success('Trip deleted permanently.');
      fetchTrash(); // Refresh trash list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete trip permanently.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Modal title="Recycle Bin" onClose={onClose} size="lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-30">♻️</div>
            <h3 className="text-base font-bold text-white mb-1">Recycle Bin is empty</h3>
            <p className="text-sm text-white/30">Trips you delete will appear here, where you can restore them.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {trips.map((trip) => {
              const formattedDate = trip.deletedAt 
                ? new Date(trip.deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently';
              return (
                <div 
                  key={trip._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(25, 30, 15, 0.08)', background: 'rgba(25, 30, 15, 0.02)' }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{trip.name}</h4>
                    <p className="text-xs text-white/40 mt-0.5">
                      {trip.destination ? `${trip.destination} · ` : ''}Deleted: {formattedDate}
                    </p>
                    <p className="text-[10px] text-white/25 mt-1">
                      💰 {trip.currency} {trip.totalAmount?.toLocaleString()} · {trip.expenseCount || 0} expenses
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => handleRestore(trip._id)}
                      className="h-8 px-3 rounded-xl text-xs font-semibold transition-all hover:bg-white/10 flex items-center gap-1.5"
                      style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.18)', color: '#10b981' }}
                      title="Restore Trip"
                    >
                      {actionLoading === trip._id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>🔄</span>
                      )}
                      <span>Restore</span>
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => setConfirm({ tripId: trip._id, tripName: trip.name })}
                      className="h-8 px-3 rounded-xl text-xs font-semibold transition-all hover:bg-white/10 flex items-center gap-1.5"
                      style={{ background: 'rgba(214, 63, 63, 0.06)', border: '1px solid rgba(214, 63, 63, 0.15)', color: '#d63f3f' }}
                      title="Delete Permanently"
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {confirm && (
        <ConfirmDialog
          title="Delete Permanently"
          message={`Are you sure you want to permanently delete "${confirm.tripName}"? This will delete all expenses, settlements, and activity logs. This action cannot be undone.`}
          variant="danger"
          confirmText="Delete Permanently"
          onConfirm={() => handlePermanentDelete(confirm.tripId)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
