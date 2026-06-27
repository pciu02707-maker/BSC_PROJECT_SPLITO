import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Avatar from '../common/Avatar';
import ConfirmDialog from '../common/ConfirmDialog';

export default function MembersPanel({ trip, isHost, currentUserId, onUpdated }) {
  const [removing, setRemoving] = useState(null);
  const [confirm, setConfirm]   = useState(null);

  const doRemove = async (memberId, memberName) => {
    setRemoving(memberId);
    try {
      await api.post(`/trips/${trip._id}/remove-member`, { memberId });
      toast.success(`${memberName} removed.`);
      onUpdated({ ...trip, members: trip.members.filter(m => (m.user?._id||m.user)?.toString() !== memberId) });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setRemoving(null); setConfirm(null); }
  };

  const doLeave = async () => {
    try {
      await api.post(`/trips/${trip._id}/leave`);
      toast.success('You left the trip.');
      window.location.href = '/dashboard';
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setConfirm(null); }
  };

  const hostId = (trip?.host?._id || trip?.host)?.toString();
  const allMembers = trip?.members || [];

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">
            Members <span className="text-white/20 normal-case font-normal">({allMembers.length})</span>
          </h2>
          {!isHost && trip?.status==='active' && (
            <button onClick={() => setConfirm({ action: doLeave, title:'Leave Trip', message:'Are you sure you want to leave this trip?', variant:'warning', confirmText:'Leave' })}
              className="text-sm text-rose-400 hover:text-rose-300 transition font-medium">
              Leave Trip
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* Host */}
          {trip?.host && (
            <div className="flex items-center justify-between p-3.5 rounded-xl"
              style={{ background:'rgba(191,101,77,0.1)', border:'1px solid rgba(191,101,77,0.18)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar user={trip.host} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {trip.host?.name}
                    {hostId===currentUserId && <span className="text-xs text-violet-400 ml-1">(you)</span>}
                  </p>
                  <p className="text-xs text-white/30 truncate">{trip.host?.email}</p>
                </div>
              </div>
              <span className="badge shrink-0 ml-2" style={{ background:'rgba(191,101,77,0.2)', color:'#bf654d', border:'1px solid rgba(191,101,77,0.3)' }}>Host</span>
            </div>
          )}

          {/* Members */}
          {allMembers
            .filter(m => (m.user?._id||m.user)?.toString() !== hostId)
            .map((m, i) => {
              const uid = (m.user?._id || m.user)?.toString();
              const isMe = uid === currentUserId;
              return (
                <div key={uid||i} className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:bg-white/4"
                  style={{ background:'rgba(25,30,15,0.04)', border:'1px solid rgba(25,30,15,0.06)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={m.user} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {m.user?.name||'Unknown'}
                        {isMe && <span className="text-xs text-violet-400 ml-1">(you)</span>}
                      </p>
                      <p className="text-xs text-white/30 truncate">{m.user?.email}</p>
                    </div>
                  </div>
                  {isHost && trip?.status==='active' && !isMe && (
                    <button
                      disabled={removing===uid}
                      onClick={() => setConfirm({ action:()=>doRemove(uid, m.user?.name), title:'Remove Member', message:`Remove ${m.user?.name} from this trip?`, variant:'danger', confirmText:'Remove' })}
                      className="text-xs text-rose-400 hover:text-rose-300 transition font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 ml-2 shrink-0">
                      {removing===uid ? '...' : 'Remove'}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog title={confirm.title} message={confirm.message}
          variant={confirm.variant} confirmText={confirm.confirmText}
          onConfirm={confirm.action} onCancel={() => setConfirm(null)} />
      )}
    </>
  );
}
