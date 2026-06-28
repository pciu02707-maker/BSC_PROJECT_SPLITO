import { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CAT_ICONS = {
  sightseeing: '🏛️',
  food: '🍽️',
  hotel: '🏨',
  transport: '🚌',
  activity: '🎟️',
  other: '📍',
};

const CAT_LABELS = {
  sightseeing: 'Sightseeing',
  food: 'Food',
  hotel: 'Hotel',
  transport: 'Transport',
  activity: 'Activity',
  other: 'Other',
};

const formatTime = (time) => {
  if (!time) return '';
  const [hh, mm] = time.split(':');
  const hour = Number(hh);
  if (Number.isNaN(hour)) return time;
  return `${hour % 12 || 12}:${mm || '00'} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function PublicPlanDetailModal({ plan, onClose, onLikeUpdate }) {
  const [likes, setLikes] = useState(plan.likes || 0);
  const [liked, setLiked] = useState(false); // local indicator if liked in this session
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    setLiking(true);
    try {
      const res = await api.post(`/public-plans/${plan._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
      if (onLikeUpdate) {
        onLikeUpdate(plan._id, res.data.likes);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Please sign in to like plans!');
      } else {
        toast.error('Failed to update like status.');
      }
    } finally {
      setLiking(false);
    }
  };

  const days = plan.itinerary?.days || [];

  return (
    <Modal title="Tour Plan Details" onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header Cover Banner */}
        <div 
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ 
            background: `radial-gradient(ellipse at top left, ${plan.coverColor || '#bf654d'}22 0%, transparent 75%)`,
            border: '1px solid rgba(25, 30, 15, 0.08)' 
          }}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {plan.name}
              </h3>
              <p className="text-sm text-white/40 mb-2">
                {plan.destination ? `📍 ${plan.destination} · ` : ''}Shared by {plan.authorName}
              </p>
              {plan.description && (
                <p className="text-xs text-white/30 italic max-w-xl leading-relaxed">
                  "{plan.description}"
                </p>
              )}
            </div>
            
            {/* Likes count */}
            <button
              onClick={handleLike}
              disabled={liking}
              className="h-9 px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:scale-105 shrink-0"
              style={liked ? {
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e'
              } : {
                background: 'rgba(25, 30, 15, 0.06)',
                border: '1px solid rgba(25, 30, 15, 0.1)',
                color: 'rgba(25, 30, 15, 0.6)'
              }}
              title="Like this plan"
            >
              <span>❤️</span>
              <span>{likes}</span>
            </button>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {days.length === 0 ? (
            <p className="text-center py-6 text-sm text-white/30">No itinerary details provided.</p>
          ) : (
            days.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className="rounded-xl p-4 border"
                style={{ borderColor: 'rgba(25, 30, 15, 0.06)', background: 'rgba(25, 30, 15, 0.02)' }}
              >
                <div className="flex items-center gap-3 mb-3 pb-2 border-b" style={{ borderColor: 'rgba(25, 30, 15, 0.06)' }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'var(--gradient-warm)' }}>
                    {dayIndex + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white">Day {dayIndex + 1}: {day.label}</h4>
                </div>

                <div className="space-y-2.5">
                  {(day.stops || []).length === 0 ? (
                    <p className="text-xs text-white/35 italic ml-10">No stops planned for this day.</p>
                  ) : (
                    day.stops.map((stop, stopIndex) => (
                      <div key={stopIndex} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ background: 'rgba(237, 230, 219, 0.12)', color: 'white' }}>
                          {CAT_ICONS[stop.category] || '📍'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <h5 className="text-xs font-bold text-white">{stop.name}</h5>
                            <span className="text-[10px] font-semibold text-white/30">{CAT_LABELS[stop.category] || 'Other'}</span>
                          </div>
                          {stop.time && (
                            <p className="text-[10px] text-white/35 mt-0.5">🕒 {formatTime(stop.time)}</p>
                          )}
                          {stop.notes && (
                            <p className="text-[11px] text-white/40 mt-1 leading-relaxed bg-white/5 p-2 rounded-lg italic">
                              "{stop.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
