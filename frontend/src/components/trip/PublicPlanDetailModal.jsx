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

export default function PublicPlanDetailModal({ plan, onClose, onLikeUpdate, user }) {
  const [likes, setLikes] = useState(plan.likes || 0);
  const [liked, setLiked] = useState(
    user ? (plan.likedBy || []).some(id => (id?._id || id).toString() === user._id.toString()) : false
  );
  const [liking, setLiking] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateShareText = () => {
    const lines = [
      `🗺️ *${plan.name} — Tour Plan*`,
      `${plan.destination ? `📍 ${plan.destination}` : ''}`,
      `Shared by ${plan.authorName}`,
      ``,
      `*Itinerary:*`,
      ...(plan.itinerary?.days || []).map((day, idx) => {
        const stopsStr = (day.stops || []).map(s => {
          const timeStr = s.time ? `[${formatTime(s.time)}] ` : '';
          return `  - ${timeStr}${s.name} (${CAT_LABELS[s.category] || 'Other'})`;
        }).join('\n');
        return `• Day ${idx + 1}: ${day.label}\n${stopsStr || '  - No stops'}`;
      }),
      ``,
      `Powered by Splito 🧳`,
    ];
    return lines.join('\n');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateShareText());
    toast.success('Itinerary copied to clipboard!');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${plan.name} — Splito Itinerary`,
          text: generateShareText(),
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopySummary();
    }
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const purple = [124, 58, 237];
      const white = [255, 255, 255];
      const dark = [20, 20, 35];
      const gray = [120, 120, 140];

      const pageW = 210;
      const margin = 18;
      let y = 0;

      // Header band
      doc.setFillColor(...purple);
      doc.rect(0, 0, pageW, 42, 'F');

      doc.setTextColor(...white);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Splito', margin, 18);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('Public Travel Guide', margin, 27);

      doc.setFontSize(9);
      doc.setTextColor(200, 185, 255);
      doc.text(`Downloaded ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`, margin, 35);
      y = 55;

      // Plan Details
      doc.setTextColor(...dark);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(plan.name, margin, y); y += 8;

      doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
      doc.text(`Shared by: ${plan.authorName} · Likes: ${likes}`, margin, y); y += 6;
      if (plan.destination) {
        doc.text(`📍 Destination: ${plan.destination}`, margin, y); y += 6;
      }
      if (plan.description) {
        doc.setFont('helvetica','italic');
        doc.text(`"${plan.description}"`, margin, y); y += 8;
      }
      y += 5;

      // Tour Plan Days
      doc.setFillColor(...purple);
      doc.rect(margin, y, pageW-margin*2, 8, 'F');
      doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text('TOUR PLAN ITINERARY', margin + 3, y + 5.5); y += 12;

      days.forEach((day, dayIndex) => {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setTextColor(...dark); doc.setFontSize(11); doc.setFont('helvetica','bold');
        doc.text(`Day ${dayIndex + 1}: ${day.label}`, margin, y);
        y += 6;

        const stops = day.stops || [];
        if (!stops.length) {
          doc.setTextColor(...gray); doc.setFontSize(9); doc.setFont('helvetica','italic');
          doc.text('  - No stops planned', margin + 4, y);
          y += 6;
        } else {
          stops.forEach(stop => {
            if (y > 265) { doc.addPage(); y = 20; }
            const timeStr = stop.time ? formatTime(stop.time) : 'Any time';
            const catLabel = CAT_LABELS[stop.category] || 'Other';
            doc.setTextColor(...dark); doc.setFontSize(9); doc.setFont('helvetica','normal');
            doc.text(`• [${timeStr}] ${stop.name} (${catLabel})`, margin + 4, y);
            y += 5;
            if (stop.notes) {
              if (y > 265) { doc.addPage(); y = 20; }
              doc.setTextColor(...gray); doc.setFontSize(8.5); doc.setFont('italic');
              doc.text(`  Note: "${stop.notes}"`, margin + 6, y);
              y += 5;
            }
          });
        }
        y += 4; // spacing between days
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text(`Splito — Public Travel Guide · Page ${p}/${pageCount}`, pageW/2, 290, {align:'center'});
      }

      doc.save(`${plan.name.replace(/\s+/g,'-')}-itinerary.pdf`);
      toast.success('Itinerary PDF downloaded! 📄');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleLike = async () => {
    setLiking(true);
    try {
      const res = await api.post(`/public-plans/${plan._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
      if (onLikeUpdate) {
        onLikeUpdate(plan._id, res.data.likes, res.data.liked);
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

          {/* Share/Export Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
            <button onClick={handleDownloadPDF} disabled={generating}
              className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/5"
              style={{ background: 'rgba(25, 30, 15, 0.06)', border: '1px solid rgba(25, 30, 15, 0.1)', color: 'rgba(25, 30, 15, 0.6)' }}>
              {generating ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>📄</span>
              )}
              <span>Download PDF</span>
            </button>
            <button onClick={handleCopySummary}
              className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/5"
              style={{ background: 'rgba(25, 30, 15, 0.06)', border: '1px solid rgba(25, 30, 15, 0.1)', color: 'rgba(25, 30, 15, 0.6)' }}>
              <span>📋</span>
              <span>Copy Itinerary</span>
            </button>
            <button onClick={handleWebShare}
              className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:bg-white/5"
              style={{ background: 'rgba(25, 30, 15, 0.06)', border: '1px solid rgba(25, 30, 15, 0.1)', color: 'rgba(25, 30, 15, 0.6)' }}>
              <span>📤</span>
              <span>Share</span>
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
