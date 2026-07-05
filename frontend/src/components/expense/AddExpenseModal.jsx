import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

const CATEGORIES = [
  { id: "food", icon: "🍜", label: "Food" },
  { id: "hotel", icon: "🏨", label: "Hotel" },
  { id: "transport", icon: "🚌", label: "Transport" },
  { id: "entertainment", icon: "🎉", label: "Fun" },
  { id: "shopping", icon: "🛍️", label: "Shopping" },
  { id: "other", icon: "💳", label: "Other" },
];

export default function AddExpenseModal({
  trip,
  members,
  currentUser,
  onClose,
  onAdded,
}) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    splitType: "equal",
    category: "food",
    note: "",
  });
  // Multi-payer state: { userId: amountStr }
  const [payers, setPayers] = useState({ [currentUser?._id]: "" });
  const [splitEvenly, setSplitEvenly] = useState(true); // auto-split payer amounts evenly
  const [participants, setParticipants] = useState(members.map((m) => m._id));
  const [customShares, setCustomShares] = useState({});
  const [loading, setLoading] = useState(false);

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // When splitEvenly changes or payers change, auto-distribute
  useEffect(() => {
    if (!splitEvenly || !form.amount) return;
    const payerIds = Object.keys(payers);
    if (!payerIds.length) return;
    const share = (parseFloat(form.amount) / payerIds.length).toFixed(2);
    const updated = {};
    payerIds.forEach((id) => {
      updated[id] = share;
    });
    setPayers(updated);
  }, [splitEvenly, form.amount, Object.keys(payers).length]);

  const togglePayer = (id) => {
    setPayers((prev) => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        next[id] = "";
      }
      return next;
    });
  };

  const setPayerAmount = (id, val) => {
    setSplitEvenly(false);
    setPayers((prev) => ({ ...prev, [id]: val }));
  };

  const toggleParticipant = (id) =>
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const payerTotal = Object.values(payers).reduce(
    (s, v) => s + (parseFloat(v) || 0),
    0,
  );
  const totalAmt = parseFloat(form.amount) || 0;
  const payerMatch = Math.abs(payerTotal - totalAmt) < 0.01;
  const customTotal = participants.reduce(
    (s, id) => s + (parseFloat(customShares[id]) || 0),
    0,
  );
  const equalShare =
    totalAmt && participants.length
      ? (totalAmt / participants.length).toFixed(2)
      : "0";

  const buildPaidBy = () =>
    Object.entries(payers).map(([user, amount]) => ({
      user,
      amount: parseFloat(amount) || 0,
    }));

  const buildParticipants = () =>
    form.splitType === "equal"
      ? participants.map((id) => ({ user: id }))
      : participants.map((id) => ({
          user: id,
          share: parseFloat(customShares[id]) || 0,
        }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const titleToUse = form.title.trim() || "Expense";
    if (!totalAmt || totalAmt <= 0)
      return toast.error("Valid amount required.");
    if (!Object.keys(payers).length)
      return toast.error("Select at least one payer.");
    if (!payerMatch)
      return toast.error(
        `Payer amounts (${payerTotal.toFixed(2)}) must equal total (${totalAmt}).`,
      );
    if (!participants.length)
      return toast.error("Select at least one participant.");
    if (form.splitType === "custom" && Math.abs(customTotal - totalAmt) > 0.01)
      return toast.error(
        `Shares (${customTotal.toFixed(2)}) must equal total (${totalAmt}).`,
      );

    setLoading(true);
    try {
      const res = await api.post("/expenses", {
        ...form,
        title: titleToUse,
        tripId: trip._id,
        amount: totalAmt,
        paidBy: buildPaidBy(),
        participants: buildParticipants(),
      });
      toast.success("Expense added! 💸");
      onAdded(res.data.expense);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Expense" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="label">Category</label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setForm({ ...form, category: cat.id })}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                style={{
                  background:
                    form.category === cat.id
                      ? "rgba(191,101,77,0.2)"
                      : "rgba(237,230,219,0.55)",
                  border: `1px solid ${form.category === cat.id ? "rgba(191,101,77,0.45)" : "rgba(216,207,194,0.72)"}`,
                  transform:
                    form.category === cat.id ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] text-white/50 font-medium hidden sm:block">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={h}
              className="input"
              placeholder="Dinner at Sea Palace (optional)"
            />
          </div>
          <div>
            <label className="label">Total Amount ({trip.currency}) *</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={h}
              className="input text-lg font-bold"
              style={{ color: "#bf654d" }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* ── PAID BY (multi-payer) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Paid By</label>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${payerMatch || !form.amount ? "text-emerald-400" : "text-rose-400"}`}
              >
                {form.amount
                  ? `${payerTotal.toFixed(2)} / ${totalAmt.toFixed(2)}`
                  : ""}
              </span>
              {Object.keys(payers).length > 1 && (
                <button
                  type="button"
                  onClick={() => setSplitEvenly(true)}
                  className="text-xs px-2 py-0.5 rounded-lg font-semibold transition-all"
                  style={{
                    background: "rgba(191,101,77,0.14)",
                    color: "#bf654d",
                    border: "1px solid rgba(191,101,77,0.28)",
                  }}
                >
                  Split evenly
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {members.map((m) => {
              const isPayer = m._id in payers;
              return (
                <div
                  key={m._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                  style={{
                    background: isPayer
                      ? "rgba(191,101,77,0.1)"
                      : "rgba(237,230,219,0.55)",
                    border: `1px solid ${isPayer ? "rgba(191,101,77,0.28)" : "rgba(216,207,194,0.72)"}`,
                  }}
                >
                  <div
                    onClick={() => togglePayer(m._id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer transition-all ${isPayer ? "bg-violet-600" : "border border-white/20"}`}
                  >
                    {isPayer && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(135deg,#bf654d,#e48b6b)",
                    }}
                  >
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <span
                    onClick={() => togglePayer(m._id)}
                    className="text-sm font-medium text-white flex-1 cursor-pointer"
                  >
                    {m.name}
                    {m._id === currentUser?._id && (
                      <span className="text-violet-400 text-xs ml-1">
                        (you)
                      </span>
                    )}
                  </span>
                  {isPayer && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/30">
                        {trip.currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payers[m._id]}
                        onChange={(e) => setPayerAmount(m._id, e.target.value)}
                        className="w-24 input py-1 text-sm text-right font-bold"
                        style={{ color: "#bf654d" }}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Split type */}
        <div>
          <label className="label">Split Among Participants</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {["equal", "custom"].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm({ ...form, splitType: t })}
                className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all"
                style={{
                  background:
                    form.splitType === t
                      ? "linear-gradient(135deg,rgba(191,101,77,0.22),rgba(228,139,107,0.16))"
                      : "rgba(237,230,219,0.65)",
                  border: `1px solid ${form.splitType === t ? "rgba(191,101,77,0.45)" : "rgba(216,207,194,0.8)"}`,
                  color:
                    form.splitType === t ? "#bf654d" : "rgba(61,49,40,0.5)",
                }}
              >
                {t === "equal" ? "⚖️ Equal" : "✏️ Custom"}
              </button>
            ))}
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/35">
              Select who shares this expense
            </span>
            {form.splitType === "equal" &&
              form.amount &&
              participants.length > 0 && (
                <span className="text-xs text-violet-400 font-medium">
                  {trip.currency} {equalShare} each
                </span>
              )}
            {form.splitType === "custom" && form.amount && (
              <span
                className={`text-xs font-medium ${Math.abs(customTotal - totalAmt) < 0.01 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {customTotal.toFixed(2)} / {totalAmt.toFixed(2)}
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {members.map((m) => (
              <div
                key={m._id}
                onClick={() => toggleParticipant(m._id)}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all select-none"
                style={{
                  background: participants.includes(m._id)
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${participants.includes(m._id) ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${participants.includes(m._id) ? "bg-emerald-600" : "border border-white/20"}`}
                >
                  {participants.includes(m._id) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>
                <span className="text-sm text-white flex-1">{m.name}</span>
                {form.splitType === "custom" &&
                  participants.includes(m._id) && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customShares[m._id] || ""}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCustomShares((p) => ({
                          ...p,
                          [m._id]: e.target.value,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-24 input py-1 text-sm text-right font-bold"
                      style={{ color: "#34d399" }}
                      placeholder="0.00"
                    />
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="label">Note (optional)</label>
          <input
            name="note"
            value={form.note}
            onChange={h}
            className="input"
            placeholder="Any extra detail..."
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? "Adding..." : "+ Add Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
