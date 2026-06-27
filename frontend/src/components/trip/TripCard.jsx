import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';

const STATUS_CONFIG = {
  active: 'badge-active', locked: 'badge-locked', closed: 'badge-closed',
};

export default function TripCard({ trip, currentUserId, isPinned, onPin, onEdit, onLock, onDelete, onReopen, onCloseTrip }) {
  const memberCount = trip.members?.length || 0;

  const hostId = trip.host?._id?.toString() || trip.host?.toString();
  const isHost = currentUserId && hostId === currentUserId;

  const handlePinClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPin(trip._id);
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(trip);
  };

  const handleLockClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onLock(trip);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(trip._id);
  };

  const handleReopenClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onReopen(trip);
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCloseTrip(trip);
  };

  return (
    <Link to={`/trips/${trip._id}`}
      className="card card-hover block group relative overflow-hidden cursor-pointer"
      style={{ minHeight: '172px' }}>

      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300 group-hover:h-1.5"
        style={{ background:`linear-gradient(90deg,${trip.coverColor||'#bf654d'},${trip.coverColor||'#e48b6b'}88)` }} />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background:`radial-gradient(ellipse at top left,${trip.coverColor||'#bf654d'}12 0%,transparent 60%)` }} />

      <div className="relative pt-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-1 text-sm sm:text-base"
            style={{ fontFamily:'DM Sans,sans-serif' }}>
            {trip.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {onPin && (
              <div className="flex items-center gap-1 z-20">
                <button
                  type="button"
                  onClick={handlePinClick}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/15 text-xs border border-white/5 ${
                    isPinned ? 'bg-amber-500/20 border-amber-500/35 text-amber-300' : 'opacity-40 hover:opacity-100'
                  }`}
                  title={isPinned ? "Unpin Trip" : "Pin Trip"}
                >
                  📌
                </button>
                {isHost && onEdit && (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/15 text-xs border border-white/5 opacity-60 hover:opacity-100"
                    title="Edit Trip"
                  >
                    ✏️
                  </button>
                )}
                {isHost && (
                  <>
                    {trip.status === 'active' && onLock && (
                      <button
                        type="button"
                        onClick={handleLockClick}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/15 text-xs border border-white/5 opacity-60 hover:opacity-100"
                        title="Lock Trip"
                      >
                        🔒
                      </button>
                    )}
                    {trip.status === 'locked' && onCloseTrip && (
                      <button
                        type="button"
                        onClick={handleCloseClick}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/15 text-xs border border-white/5 opacity-60 hover:opacity-100"
                        title="Close Trip"
                      >
                        ✅
                      </button>
                    )}
                    {trip.status !== 'active' && onReopen && (
                      <button
                        type="button"
                        onClick={handleReopenClick}
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/15 text-xs border border-white/5 opacity-60 hover:opacity-100"
                        title="Reopen Trip"
                      >
                        🔓
                      </button>
                    )}
                  </>
                )}
                {isHost && onDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/25 text-xs text-rose-400"
                    title="Delete Trip"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}

            <span className={`badge shrink-0 ${STATUS_CONFIG[trip.status]||'badge-active'}`}>{trip.status}</span>
          </div>
        </div>

        {trip.destination && <p className="text-xs text-white/35 mb-1 truncate">{trip.destination}</p>}
        {trip.description && <p className="text-xs text-white/25 line-clamp-1 mb-2">{trip.description}</p>}

        <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor:'rgba(25,30,15,0.06)' }}>
          {/* Avatars */}
          <div className="flex items-center -space-x-2">
            {trip.members?.slice(0, 5).map((m, idx) => (
              <div key={m.user?._id||idx} className="ring-2 rounded-lg transition-transform group-hover:-translate-y-0.5"
                style={{ ringColor:'rgba(248,245,239,1)', transitionDelay:`${idx*25}ms` }}>
                <Avatar user={m.user} size="xs" />
              </div>
            ))}
            {memberCount>5 && (
              <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center text-[9px] text-white/40"
                style={{ borderColor:'rgba(248,245,239,1)', background:'rgba(25,30,15,0.08)' }}>
                +{memberCount-5}
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] text-white/25">{trip.expenseCount||0} expenses</p>
            <p className="text-sm font-bold text-white">{trip.currency} {(trip.totalAmount||0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
