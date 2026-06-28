import { useState, useRef } from 'react';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

const SOCIAL = [
  { name:'WhatsApp', icon:'💬', color:'#25d366',
    url:(text)=>`https://wa.me/?text=${encodeURIComponent(text)}` },
  { name:'Twitter/X', icon:'🐦', color:'#1da1f2',
    url:(text)=>`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
  { name:'Facebook', icon:'👥', color:'#1877f2',
    url:(text)=>`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}` },
  { name:'Telegram', icon:'✈️', color:'#0088cc',
    url:(text)=>`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}` },
];

const CATEGORY_LABELS = {
  sightseeing: 'Sightseeing',
  food: 'Food',
  hotel: 'Hotel',
  transport: 'Transport',
  activity: 'Activity',
  other: 'Other'
};

const formatTime = (time) => {
  if (!time) return '';
  const [hh, mm] = time.split(':');
  const hour = Number(hh);
  if (Number.isNaN(hour)) return time;
  return `${hour % 12 || 12}:${mm || '00'} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function ExportReportModal({ trip, expenses, balanceData, onClose }) {
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  const { settlements=[], summary=[], totalExpense=0 } = balanceData || {};

  const generateShareText = () => {
    const tourDays = trip.itinerary?.days || [];
    const tourPlanLines = tourDays.length > 0
      ? [
          `*Tour Plan (Itinerary):*`,
          ...tourDays.map((day, idx) => {
            const dateStr = day.date ? ` (${new Date(day.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})})` : '';
            const stopsStr = (day.stops || []).map(s => {
              const timeStr = s.time ? `[${formatTime(s.time)}] ` : '';
              return `  - ${timeStr}${s.name}`;
            }).join('\n');
            return `• Day ${idx + 1}: ${day.label}${dateStr}\n${stopsStr || '  - No stops'}`;
          }),
          ``
        ]
      : [];

    const lines = [
      `📊 *${trip.name} — Trip Report*`,
      `${trip.destination || 'N/A'}`,
      `💰 Total: ${trip.currency} ${totalExpense?.toLocaleString()}`,
      ``,
      ...tourPlanLines,
      `*Settlements:*`,
      ...settlements.map(s => `• ${s.fromName} → ${s.toName}: ${trip.currency} ${s.amount?.toFixed(2)}`),
      ``,
      `*Per Person:*`,
      ...summary.map(s => `• ${s.user?.name}: Paid ${trip.currency} ${s.totalPaid} | Net ${s.netBalance >= 0 ? '+' : ''}${trip.currency} ${s.netBalance?.toFixed(2)}`),
      ``,
      `Powered by Splito 🧳`,
    ];
    return lines.join('\n');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Trip link copied!');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateShareText());
    toast.success('Summary copied to clipboard!');
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip.name} — Splito Report`,
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
      const green = [16, 185, 129];
      const red = [244, 63, 94];

      const pageW = 210;
      const margin = 18;
      let y = 0;

      // ── Header band ──
      doc.setFillColor(...purple);
      doc.rect(0, 0, pageW, 42, 'F');

      doc.setTextColor(...white);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Splito', margin, 18);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('Trip Expense Report', margin, 27);

      doc.setFontSize(9);
      doc.setTextColor(200, 185, 255);
      doc.text(`Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`, margin, 35);
      y = 55;

      // ── Trip info ──
      doc.setTextColor(...dark);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(trip.name, margin, y); y += 8;

      if (trip.destination) {
        doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
        doc.text(`${trip.destination}`, margin, y); y += 6;
      }
      if (trip.startDate || trip.endDate) {
        const sd = trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '?';
        const ed = trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '?';
        doc.text(`📅 ${sd} → ${ed}`, margin, y); y += 5;
      }
      y += 5;

      // ── Stats row ──
      const stats = [
        { label: 'Total Expense', value: `${trip.currency} ${totalExpense?.toLocaleString()}` },
        { label: 'Expenses', value: `${expenses?.length || 0}` },
        { label: 'Members', value: `${summary.length}` },
        { label: 'Status', value: trip.status },
      ];
      const boxW = (pageW - margin * 2 - 9) / 4;
      stats.forEach((s, i) => {
        const x = margin + i * (boxW + 3);
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
        doc.setTextColor(...purple); doc.setFontSize(11); doc.setFont('helvetica','bold');
        doc.text(s.value, x + boxW/2, y + 7, { align: 'center' });
        doc.setTextColor(...gray); doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.text(s.label, x + boxW/2, y + 13, { align: 'center' });
      });
      y += 26;

      // ── Settlement Plan ──
      doc.setFillColor(...purple);
      doc.rect(margin, y, pageW - margin*2, 8, 'F');
      doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text('SETTLEMENT PLAN', margin + 3, y + 5.5); y += 12;

      if (!settlements.length) {
        doc.setTextColor(...green); doc.setFontSize(10); doc.setFont('helvetica','normal');
        doc.text('✓ Everyone is settled up!', margin, y); y += 8;
      } else {
        settlements.forEach((s, i) => {
          const bg = i % 2 === 0;
          if (bg) { doc.setFillColor(248, 246, 255); doc.rect(margin, y-4, pageW-margin*2, 9, 'F'); }
          doc.setTextColor(...dark); doc.setFontSize(10); doc.setFont('helvetica','normal');
          doc.text(`${s.fromName}`, margin + 3, y);
          doc.setTextColor(...gray);
          doc.text(`→`, margin + 52, y);
          doc.setTextColor(...dark);
          doc.text(`${s.toName}`, margin + 60, y);
          doc.setTextColor(...green); doc.setFont('helvetica','bold');
          doc.text(`${trip.currency} ${s.amount?.toFixed(2)}`, pageW - margin - 3, y, { align: 'right' });
          y += 9;
        });
      }
      y += 6;

      // ── Per Person Summary ──
      doc.setFillColor(...purple);
      doc.rect(margin, y, pageW-margin*2, 8, 'F');
      doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text('PER PERSON SUMMARY', margin + 3, y + 5.5); y += 12;

      // Table header
      doc.setFillColor(240, 238, 255);
      doc.rect(margin, y-4, pageW-margin*2, 8, 'F');
      doc.setTextColor(...purple); doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.text('Name', margin+3, y); doc.text('Total Paid', margin+65, y);
      doc.text('Share', margin+100, y); doc.text('Net Balance', pageW-margin-3, y, {align:'right'});
      y += 7;

      summary.forEach((s, i) => {
        if (i%2===0) { doc.setFillColor(250,249,255); doc.rect(margin,y-4,pageW-margin*2,8,'F'); }
        const net = s.netBalance;
        doc.setTextColor(...dark); doc.setFontSize(9); doc.setFont('helvetica','normal');
        doc.text(s.user?.name||'Unknown', margin+3, y);
        doc.text(`${trip.currency} ${s.totalPaid?.toFixed(2)}`, margin+65, y);
        doc.text(`${trip.currency} ${s.totalShare?.toFixed(2)}`, margin+100, y);
        doc.setTextColor(...(net>=0?green:red)); doc.setFont('helvetica','bold');
        doc.text(`${net>=0?'+':''}${trip.currency} ${net?.toFixed(2)}`, pageW-margin-3, y, {align:'right'});
        y += 8;
      });
      y += 8;

      // ── Tour Plan ──
      const days = trip.itinerary?.days || [];
      if (days.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFillColor(...purple);
        doc.rect(margin, y, pageW-margin*2, 8, 'F');
        doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
        doc.text('TOUR PLAN (ITINERARY)', margin + 3, y + 5.5); y += 12;

        days.forEach((day, dayIndex) => {
          if (y > 255) { doc.addPage(); y = 20; }
          const dateStr = day.date ? new Date(day.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '';
          doc.setTextColor(...dark); doc.setFontSize(10); doc.setFont('helvetica','bold');
          doc.text(`Day ${dayIndex + 1}: ${day.label}${dateStr ? ` (${dateStr})` : ''}`, margin, y);
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
              const catLabel = CATEGORY_LABELS[stop.category] || 'Other';
              doc.setTextColor(...dark); doc.setFontSize(9); doc.setFont('helvetica','normal');
              doc.text(`• [${timeStr}] ${stop.name} (${catLabel})`, margin + 4, y);
              y += 5.5;
            });
          }
          y += 3; // spacing between days
        });
        y += 5;
      }

      // ── Expense List ──
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFillColor(...purple);
      doc.rect(margin, y, pageW-margin*2, 8, 'F');
      doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.text('ALL EXPENSES', margin + 3, y + 5.5); y += 12;

      expenses?.forEach((exp, i) => {
        if (y > 265) { doc.addPage(); y = 20; }
        if (i%2===0) { doc.setFillColor(250,249,255); doc.rect(margin,y-3,pageW-margin*2,9,'F'); }

        const payerNames = exp.paidBy?.map(p=>p.user?.name||'?').join(', ') || '?';
        doc.setTextColor(...dark); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
        doc.text(exp.title, margin+3, y);
        doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
        doc.text(`Paid by: ${payerNames} • ${exp.category}`, margin+3, y+4);
        doc.setTextColor(...purple); doc.setFont('helvetica','bold');
        doc.text(`${trip.currency} ${exp.amount?.toLocaleString()}`, pageW-margin-3, y, {align:'right'});
        y += 10;
      });

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text(`Splito — Trip Expense Manager · Page ${p}/${pageCount}`, pageW/2, 290, {align:'center'});
      }

      doc.save(`${trip.name.replace(/\s+/g,'-')}-splito-report.pdf`);
      toast.success('PDF downloaded! 📄');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF.');
    } finally { setGenerating(false); }
  };

  return (
    <Modal title="Export & Share Report" onClose={onClose}>
      <div className="space-y-5">

        {/* Trip summary preview */}
        <div className="rounded-xl p-4" style={{background:'rgba(191,101,77,0.1)',border:'1px solid rgba(191,101,77,0.2)'}}>
          <p className="font-bold text-white text-lg" style={{fontFamily:'DM Sans,sans-serif'}}>{trip.name}</p>
          <p className="text-sm text-white/40 mt-0.5">{trip.destination || 'No destination set'}</p>
          <div className="flex items-center gap-4 mt-3">
            <div><p className="text-xs text-white/30">Total</p><p className="font-bold text-violet-300">{trip.currency} {totalExpense?.toLocaleString()}</p></div>
            <div><p className="text-xs text-white/30">Expenses</p><p className="font-bold text-white">{expenses?.length||0}</p></div>
            <div><p className="text-xs text-white/30">Settlements</p><p className="font-bold text-white">{settlements.length}</p></div>
          </div>
        </div>

        {/* Download PDF */}
        <div>
          <p className="label">Download Report</p>
          <button onClick={handleDownloadPDF} disabled={generating}
            className="btn-primary w-full py-3 text-base gap-3">
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                Generating PDF...
              </>
            ) : (
              <> 📄 Download PDF Report </>
            )}
          </button>
          <p className="text-xs text-white/25 mt-2 text-center">
            Includes settlement plan, per-person summary & all expenses
          </p>
        </div>

        {/* Copy options */}
        <div>
          <p className="label">Quick Share</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCopyLink} className="btn-secondary py-2.5 gap-2 text-sm">
              🔗 Copy Trip Link
            </button>
            <button onClick={handleCopySummary} className="btn-secondary py-2.5 gap-2 text-sm">
              📋 Copy Summary
            </button>
          </div>
        </div>

        {/* Web Share API (mobile) */}
        {navigator.share && (
          <button onClick={handleWebShare}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{background:'rgba(95,126,68,0.15)',border:'1px solid rgba(95,126,68,0.25)',color:'#5f7e44'}}>
            📤 Share via Phone
          </button>
        )}

        {/* Social platforms */}
        <div>
          <p className="label">Share on Social</p>
          <div className="grid grid-cols-2 gap-2">
            {SOCIAL.map(s => (
              <a key={s.name} href={s.url(generateShareText())} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{background:`${s.color}18`,border:`1px solid ${s.color}33`,color:s.color}}>
                <span className="text-base">{s.icon}</span>{s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
