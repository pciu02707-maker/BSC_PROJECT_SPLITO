import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import TripCard from '../components/trip/TripCard';
import CreateTripModal from '../components/trip/CreateTripModal';
import JoinTripModal from '../components/trip/JoinTripModal';
import EditTripModal from '../components/trip/EditTripModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import RecycleBinModal from '../components/trip/RecycleBinModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin]     = useState(false);
  const [showTrash, setShowTrash]   = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [confirm, setConfirm]         = useState(null);
  const [pinnedTrips, setPinnedTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('splito_pinned_trips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handlePin = (tripId) => {
    setPinnedTrips(prev => {
      const next = prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId];
      localStorage.setItem('splito_pinned_trips', JSON.stringify(next));
      return next;
    });
  };

  const handleLock = (trip) => {
    setConfirm({
      title: 'Lock Trip',
      message: 'No new expenses can be added while locked. You can reopen it later.',
      variant: 'warning',
      confirmText: 'Lock Trip',
      action: async () => {
        try {
          await api.patch(`/trips/${trip._id}/status`, { status: 'locked' });
          setTrips(prev => prev.map(t => t._id === trip._id ? { ...t, status: 'locked' } : t));
          toast.success('Trip locked!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to lock trip.');
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const handleDelete = (tripId) => {
    setConfirm({
      title: 'Delete Trip',
      message: 'This will permanently delete the trip and ALL its expenses. This cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete Trip',
      action: async () => {
        try {
          await api.delete(`/trips/${tripId}`);
          setTrips(prev => prev.filter(t => t._id !== tripId));
          toast.success('Trip deleted.');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete trip.');
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const handleReopen = (trip) => {
    setConfirm({
      title: 'Reopen Trip',
      message: 'Members will be able to add expenses again.',
      variant: 'info',
      confirmText: 'Reopen',
      action: async () => {
        try {
          await api.patch(`/trips/${trip._id}/status`, { status: 'active' });
          setTrips(prev => prev.map(t => t._id === trip._id ? { ...t, status: 'active' } : t));
          toast.success('Trip reopened!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to reopen trip.');
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const handleClose = (trip) => {
    setConfirm({
      title: 'Close Trip',
      message: 'This will finalize the trip. Expenses can no longer be edited.',
      variant: 'warning',
      confirmText: 'Close Trip',
      action: async () => {
        try {
          await api.patch(`/trips/${trip._id}/status`, { status: 'closed' });
          setTrips(prev => prev.map(t => t._id === trip._id ? { ...t, status: 'closed' } : t));
          toast.success('Trip closed!');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to close trip.');
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const fetchTrips = async () => {
    try { const res = await api.get('/trips'); setTrips(res.data.trips); }
    catch { toast.error('Failed to load trips.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleTripCreated = (trip) => { setTrips(p => [trip, ...p]); setShowCreate(false); };
  const handleTripJoined  = (trip) => {
    setTrips(p => p.find(t=>t._id===trip._id) ? p : [trip,...p]);
    setShowJoin(false);
  };

  const activeTrips = trips.filter(t => t.status==='active');
  const otherTrips  = trips.filter(t => t.status!=='active');

  const sortedOtherTrips = [...otherTrips].sort((a, b) => {
    const aPinned = pinnedTrips.includes(a._id);
    const bPinned = pinnedTrips.includes(b._id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const sortedActiveTrips = [...activeTrips].sort((a, b) => {
    const aPinned = pinnedTrips.includes(a._id);
    const bPinned = pinnedTrips.includes(b._id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 anim-slide-up">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="lg" />
            <div>
              <p className="text-white/35 text-xs">Welcome back,</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily:'DM Sans,sans-serif' }}>
                {user?.name?.split(' ')[0]} 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={() => setShowTrash(true)} className="btn-secondary text-sm flex-1 sm:flex-none">
              ♻️ <span className="hidden xs:inline">Recycle Bin</span>
            </button>
            <button onClick={() => setShowJoin(true)} className="btn-secondary text-sm flex-1 sm:flex-none">
              🔗 <span className="hidden xs:inline">Join Trip</span>
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex-1 sm:flex-none">
              + <span className="hidden xs:inline">New Trip</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {trips.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 anim-slide-up d200">
            {[
              { label:'Total Trips',    value:trips.length,                                      icon:'🧳', color:'rgba(191,101,77,0.15)' },
              { label:'Active',         value:activeTrips.length,                                icon:'✈️', color:'rgba(95,126,68,0.1)' },
              { label:'Closed',         value:otherTrips.filter(t=>t.status==='closed').length,  icon:'✅', color:'rgba(228,139,107,0.12)' },
              { label:'Total Expenses', value:trips.reduce((s,t)=>s+(t.expenseCount||0),0),     icon:'💸', color:'rgba(245,158,11,0.12)' },
            ].map(s => (
              <div key={s.label} className="card py-2.5 sm:py-3.5 text-center"
                style={{ background:s.color, borderColor:'rgba(25,30,15,0.07)' }}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="text-lg sm:text-xl">{s.icon}</span>
                  <span className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily:'DM Sans,sans-serif' }}>{s.value}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-white/35">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1,2,3].map(i => <div key={i} className="card h-44 skeleton" />)}
          </div>
        ) : trips.length===0 ? (
          <div className="text-center py-20 sm:py-28 anim-fade-in">
            <div className="text-6xl sm:text-7xl mb-5 anim-float inline-block">🧳</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily:'DM Sans,sans-serif' }}>No trips yet</h2>
            <p className="text-white/30 text-sm mb-7">Create your first trip or join one with an invite code.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <button onClick={()=>setShowJoin(true)} className="btn-secondary">Join a Trip</button>
              <button onClick={()=>setShowCreate(true)} className="btn-primary">Create a Trip</button>
            </div>
          </div>
        ) : (
          <>
            {activeTrips.length>0 && (
              <section className="mb-7 anim-slide-up d300">
                <h2 className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Active</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {sortedActiveTrips.map(trip => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      currentUserId={user?._id}
                      isPinned={pinnedTrips.includes(trip._id)}
                      onPin={handlePin}
                      onEdit={setEditingTrip}
                      onLock={handleLock}
                      onCloseTrip={handleClose}
                      onReopen={handleReopen}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
            {otherTrips.length>0 && (
              <section className="anim-slide-up d400">
                <h2 className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Closed / Locked</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {sortedOtherTrips.map(trip => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      currentUserId={user?._id}
                      isPinned={pinnedTrips.includes(trip._id)}
                      onPin={handlePin}
                      onEdit={setEditingTrip}
                      onLock={handleLock}
                      onCloseTrip={handleClose}
                      onReopen={handleReopen}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showCreate && <CreateTripModal onClose={()=>setShowCreate(false)} onCreated={handleTripCreated} />}
      {showJoin   && <JoinTripModal  onClose={()=>setShowJoin(false)}   onJoined={handleTripJoined} />}
      {showTrash  && <RecycleBinModal onClose={()=>setShowTrash(false)} onTripRestored={fetchTrips} />}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onUpdated={(updatedTrip) => {
            setTrips(prev => prev.map(t => t._id === updatedTrip._id ? updatedTrip : t));
          }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          confirmText={confirm.confirmText}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
