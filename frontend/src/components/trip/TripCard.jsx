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
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-1 text-sm sm:text-base flex-1 min-w-0"
            style={{ fontFamily:'DM Sans,sans-serif' }}>
            {trip.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {onPin && (
              <div className="flex items-center gap-1 z-20">
                 <button
                  type="button"
                  onClick={handlePinClick}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-base shrink-0"
                  style={isPinned ? {
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#fbbf24'
                  } : {
                    background: 'rgba(25,30,15,0.06)',
                    border: '1px solid rgba(25,30,15,0.1)',
                    color: 'rgba(25,30,15,0.6)'
                  }}
                  title={isPinned ? "Unpin Trip" : "Pin Trip"}
                >
                  📌
                </button>
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
