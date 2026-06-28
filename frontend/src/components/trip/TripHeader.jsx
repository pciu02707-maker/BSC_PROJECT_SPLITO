import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import EditTripModal from './EditTripModal';
import ConfirmDialog from '../common/ConfirmDialog';
import ExportReportModal from './ExportReportModal';

export default function TripHeader({ trip, isHost, onTripUpdated, onTripDeleted, expenses, balanceData }) {
  const navigate = useNavigate();
  const [showEdit, setShowEdit]       = useState(false);
  const [showExport, setShowExport]   = useState(false);
  const [confirm, setConfirm]         = useState(null); // { action, title, message, variant }
  const [copied, setCopied]           = useState(false);
  const [loading, setLoading]         = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(trip.inviteCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Invite code copied!');
  };

  const doStatusChange = async (status) => {
    setLoading(true);
    try {
      const res = await api.patch(`/trips/${trip._id}/status`, { status });
      onTripUpdated({ ...trip, status });       // update parent state immediately
      toast.success(`Trip ${status}!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); setConfirm(null); }
  };

  const doDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/trips/${trip._id}`);
      toast.success('Trip deleted.'); onTripDeleted();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); setConfirm(null); }
  };

  const [sharing, setSharing] = useState(false);
  const handleSharePlan = async () => {
    if (!trip?.itinerary?.days?.length) {
      toast.error('Add days to your Tour Plan before sharing!');
      return;
    }
    setSharing(true);
    try {
      await api.post('/public-plans', { tripId: trip._id });
      toast.success('Itinerary shared to Landing Page showcase! 🚀');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share itinerary.');
    } finally {
      setSharing(false);
    }
  };

  const currentStatus = trip?.status || 'active';

  return (
    <>
      <div className="card relative overflow-hidden anim-slide-up">
        {/* Color bar */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background:`linear-gradient(90deg,${trip?.coverColor||'#bf654d'},${trip?.coverColor||'#e48b6b'}66)` }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:`radial-gradient(ellipse at top left,${trip?.coverColor||'#bf654d'}0d 0%,transparent 60%)` }} />

        <div className="relative pt-2">
          {/* Back + title row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            {/* Name/details section */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate mb-0.5" style={{ fontFamily:'DM Sans,sans-serif' }}>
                {trip?.name}
              </h1>
              {trip?.destination && <p className="text-sm text-white/40">{trip.destination}</p>}
              {trip?.description && <p className="text-sm text-white/30 mt-0.5 line-clamp-2">{trip.description}</p>}
              {(trip?.startDate || trip?.endDate) && (
                <p className="text-xs text-white/25 mt-1">
                  📅 {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '?'}
                  {' → '}
                  {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '?'}
                </p>
              )}
            </div>

            {/* Action buttons — always visible, never overflow */}
            {isHost && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:ml-auto sm:mt-0.5">
                <button onClick={() => setShowEdit(true)}
                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 flex items-center gap-1.5"
                  style={{ border:'1px solid rgba(25,30,15,0.12)', color:'rgba(25,30,15,0.7)' }}>
                  <span className="text-base">✏️</span><span className="hidden sm:inline">Edit</span>
                </button>

                {/* LOCK — only when active */}
                {currentStatus === 'active' && (
                  <button
                    disabled={loading}
                    onClick={() => setConfirm({ action:()=>doStatusChange('locked'), title:'Lock Trip', message:'No new expenses can be added while locked. You can reopen it later.', variant:'warning', confirmText:'Lock Trip' })}
                    className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                    style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', color:'#fbbf24' }}>
                    <span className="text-base">🔒</span><span className="hidden sm:inline">Lock</span>
                  </button>
                )}

                {/* REOPEN + CLOSE — only when locked */}
                {currentStatus === 'locked' && (
                  <>
                    <button
                      disabled={loading}
                      onClick={() => setConfirm({ action:()=>doStatusChange('active'), title:'Reopen Trip', message:'Members will be able to add expenses again.', variant:'info', confirmText:'Reopen' })}
                      className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                      style={{ background:'rgba(191,101,77,0.12)', border:'1px solid rgba(191,101,77,0.25)', color:'#bf654d' }}>
                      <span className="text-base">🔓</span><span className="hidden sm:inline">Reopen</span>
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => setConfirm({ action:()=>doStatusChange('closed'), title:'Close Trip', message:'This will finalize the trip. Expenses can no longer be edited.', variant:'warning', confirmText:'Close Trip' })}
                      className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                      style={{ background:'rgba(95,126,68,0.1)', border:'1px solid rgba(95,126,68,0.2)', color:'#5f7e44' }}>
                      <span className="text-base">✅</span><span className="hidden sm:inline">Close</span>
                    </button>
                  </>
                )}

                <button
                  disabled={loading}
                  onClick={() => setConfirm({ 
                    action: doDelete, 
                    title: 'Move to Recycle Bin', 
                    message: 'Are you sure you want to delete this trip? It will be moved to the Recycle Bin, and you can restore it later from the dashboard.', 
                    variant: 'danger', 
                    confirmText: 'Move to Recycle Bin' 
                  })}
                  className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                  style={{ background:'rgba(214,63,63,0.1)', border:'1px solid rgba(214,63,63,0.2)', color:'#d63f3f' }}>
                  <span className="text-base">🗑️</span><span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom bar — invite code + export */}
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3" style={{ borderTop:'1px solid rgba(25,30,15,0.06)' }}>
            {currentStatus === 'active' && (
              <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl"
                style={{ background:'rgba(191,101,77,0.1)', border:'1px solid rgba(191,101,77,0.18)' }}>
                <span className="text-xs text-white/35 shrink-0">Invite:</span>
                <code className="font-mono font-bold text-violet-300 tracking-[0.2em] text-sm truncate">{trip?.inviteCode}</code>
                <button onClick={copyCode}
                  className="ml-auto text-base font-semibold w-8 h-8 rounded-xl shrink-0 transition-all flex items-center justify-center"
                  style={{ background: copied?'rgba(95,126,68,0.2)':'rgba(191,101,77,0.2)', color: copied?'#5f7e44':'#bf654d' }}>
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            )}
            <button onClick={handleSharePlan} disabled={sharing}
              className="h-9 px-4 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 flex items-center gap-1.5 ml-auto sm:ml-0"
              style={{ background:'rgba(191,101,77,0.1)', border:'1px solid rgba(191,101,77,0.18)', color:'#bf654d' }}>
              {sharing ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-base">📢</span>
              )}
              {/* <span>Share Plan</span> */}
            </button>
            <button onClick={() => setShowExport(true)}
              className="h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
              style={{ background:'rgba(25,30,15,0.06)', border:'1px solid rgba(25,30,15,0.1)', color:'rgba(25,30,15,0.6)' }}>
              <span className="text-base">📤</span> <span className="hidden sm:inline">Export & Share</span>
            </button>
          </div>
        </div>
      </div>

      {showEdit && <EditTripModal trip={trip} onClose={() => setShowEdit(false)} onUpdated={onTripUpdated} />}

      {showExport && (
        <ExportReportModal
          trip={trip} expenses={expenses} balanceData={balanceData}
          onClose={() => setShowExport(false)} />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          variant={confirm.variant}
          confirmText={confirm.confirmText}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)} />
      )}
    </>
  );
}
