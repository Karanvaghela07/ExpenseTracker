import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, Check, Users, UserPlus,
  Utensils, Train, ShoppingCart, Home, ShoppingBag,
  Coffee, Heart, BookOpen, Package, X, AlertCircle,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import { CATEGORIES, PAYMENT_METHODS, getToday, getCategoryColor } from '../../utils/helpers';
import './AddExpense.css';

const CAT_ICONS = {
  'Food': Utensils, 'Travel': Train, 'Groceries': ShoppingCart,
  'Rent/Bills': Home, 'Shopping': ShoppingBag, 'Entertainment': Coffee,
  'Health': Heart, 'Education': BookOpen, 'Other': Package,
};

// ─────────────────────────────────────────────────────────────
//  Helper: distribute amount equally, leftover paise to payer
// ─────────────────────────────────────────────────────────────
const equalSplit = (total, count) => {
  if (count === 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? base + remainder : base   // first slot gets the leftover
  );
};

const AddExpense = () => {
  const { state, addExpense, addPerson } = useExpense();
  const { addToast } = useToast();
  const navigate = useNavigate();

  /* ── basic fields ── */
  const [amount, setAmount]               = useState('');
  const [category, setCategory]           = useState(CATEGORIES[0]);
  const [date, setDate]                   = useState(getToday());
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [note, setNote]                   = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  /* ── split ── */
  const [isShared, setIsShared]     = useState(false);
  const [paidBy, setPaidBy]         = useState('me');   // 'me' | personId
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' | 'custom'

  // selectedPeople: [{ id, name, isNew }]
  const [selectedPeople, setSelectedPeople] = useState([]);
  // customShares: { [personId|tempId]: string amount }
  const [customShares, setCustomShares]     = useState({});
  // inline add-new-person input
  const [newPersonInput, setNewPersonInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = Number(amount) || 0;
  // total participants = me + selected others
  const totalParticipants = selectedPeople.length + 1; // +1 for "me"

  /* ── computed shares ── */
  const shares = useMemo(() => {
    if (!isShared || selectedPeople.length === 0) return {};
    if (splitMethod === 'equal') {
      const parts = equalSplit(numAmount, totalParticipants);
      const result = { me: parts[0] };
      selectedPeople.forEach((p, i) => { result[p.id] = parts[i + 1]; });
      return result;
    }
    // custom
    const result = {};
    selectedPeople.forEach((p) => {
      result[p.id] = Number(customShares[p.id]) || 0;
    });
    const othersTotal = Object.values(result).reduce((s, v) => s + v, 0);
    result.me = Math.max(0, numAmount - othersTotal);
    return result;
  }, [isShared, selectedPeople, splitMethod, numAmount, customShares, totalParticipants]);

  const assignedTotal = useMemo(() => {
    return Object.values(shares).reduce((s, v) => s + v, 0);
  }, [shares]);

  const remaining = numAmount - assignedTotal;
  const isCustomValid = splitMethod !== 'custom' || Math.abs(remaining) < 1;

  /* ── add/remove people ── */
  const togglePerson = useCallback((person) => {
    setSelectedPeople((prev) => {
      const exists = prev.find((p) => p.id === person.id);
      if (exists) {
        setCustomShares((cs) => { const n = { ...cs }; delete n[person.id]; return n; });
        return prev.filter((p) => p.id !== person.id);
      }
      return [...prev, person];
    });
  }, []);

  const addNewPersonInline = async () => {
    const name = newPersonInput.trim();
    if (!name) return;
    // check duplicate
    if (selectedPeople.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      addToast(`${name} is already added`, 'error');
      return;
    }
    // temp id for UI — real id created on submit
    const tempId = `new_${Date.now()}`;
    setSelectedPeople((prev) => [...prev, { id: tempId, name, isNew: true }]);
    setNewPersonInput('');
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!numAmount || numAmount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    if (isShared && selectedPeople.length === 0) {
      addToast('Add at least one person to split with', 'error');
      return;
    }
    if (isShared && splitMethod === 'custom' && !isCustomValid) {
      addToast(`₹${Math.abs(remaining).toLocaleString('en-IN')} ${remaining > 0 ? 'unassigned' : 'over-assigned'}`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // resolve new people — create in Firestore, get real ids
      const resolvedPeople = await Promise.all(
        selectedPeople.map(async (p) => {
          if (p.isNew) {
            const realId = await addPerson(p.name);
            return { ...p, id: realId || p.id };
          }
          return p;
        })
      );

      // build splitWith array: [{ personId, name, shareAmount, settledUp }]
      const splitWith = resolvedPeople.map((p) => ({
        personId:    p.id,
        name:        p.name,
        shareAmount: shares[selectedPeople.find((sp) => sp.name === p.name)?.id] ?? 0,
        settledUp:   false,
      }));

      // determine paidBy label
      let whoPaid = 'I paid for them';
      if (paidBy !== 'me') {
        const payer = resolvedPeople.find((p) => p.id === paidBy || selectedPeople.find((sp) => sp.id === paidBy)?.name === p.name);
        whoPaid = payer ? `${payer.name} paid` : 'They paid for me';
      }

      // legacy compat: keep sharedWith as comma-separated names
      const sharedWithNames = resolvedPeople.map((p) => p.name).join(', ');
      // splitAmount = total owed to me (sum of others' shares when I paid)
      const splitAmount = paidBy === 'me'
        ? splitWith.reduce((s, p) => s + p.shareAmount, 0)
        : shares.me || 0;

      await addExpense({
        amount:      numAmount,
        category,
        date,
        paymentMethod,
        note,
        isShared,
        // new multi-person fields
        splitWith:   isShared ? splitWith : [],
        // legacy fields — kept for backward compat with existing data
        sharedWith:  isShared ? sharedWithNames : '',
        whoPaid:     isShared ? whoPaid : '',
        splitAmount: isShared ? splitAmount : 0,
        settledUp:   false,
      });

      addToast('Expense saved!', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      addToast('Failed to save. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CatIcon = CAT_ICONS[category] || Package;
  // existing people not yet selected
  const availablePeople = state.people.filter(
    (p) => !selectedPeople.find((sp) => sp.name === p.name)
  );

  return (
    <div className="page-container bank-page">

      {/* ── blue hero ── */}
      <div className="bank-hero add-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <span className="add-hero-label">New Expense</span>
          <span style={{ width: 38 }} />
        </div>

        <div className="add-amount-row">
          <span className="add-currency">₹</span>
          <input
            type="number"
            className="add-amount-input"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="1" min="0"
            autoFocus
            inputMode="decimal"
          />
        </div>

        <button type="button" className="add-cat-chip" onClick={() => setShowCatPicker(true)}>
          <CatIcon size={14} />
          <span>{category}</span>
          <ChevronDown size={13} />
        </button>
      </div>

      {/* ── white sheet ── */}
      <div className="bank-sheet add-sheet">
        <form className="add-form" onSubmit={handleSubmit}>

          {/* date + payment */}
          <div className="add-row2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={date}
                onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Payment</label>
              <select className="form-select" value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* note */}
          <div className="form-group">
            <label className="form-label">Note</label>
            <input type="text" className="form-input"
              placeholder="What was this for?"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {/* ── split toggle ── */}
          <div className="add-split-toggle" onClick={() => setIsShared((v) => !v)}>
            <div className="add-split-toggle-left">
              <div className="add-split-toggle-icon">
                <Users size={16} color="#2662e8" />
              </div>
              <div>
                <div className="add-split-toggle-title">Split with people</div>
                <div className="add-split-toggle-sub">
                  {isShared && selectedPeople.length > 0
                    ? `${selectedPeople.length} person${selectedPeople.length > 1 ? 's' : ''} added`
                    : 'Tap to share cost with others'}
                </div>
              </div>
            </div>
            <div className={`add-toggle-ui ${isShared ? 'on' : ''}`} />
          </div>

          {/* ── split section ── */}
          {isShared && (
            <div className="add-split-section">

              {/* ── STEP 1: Add people ── */}
              <div className="add-step-label">
                <span className="add-step-num">1</span>
                <span>Who are you splitting with?</span>
              </div>

              {/* selected people chips */}
              {selectedPeople.length > 0 && (
                <div className="add-selected-people">
                  {selectedPeople.map((p) => (
                    <div key={p.id} className="add-person-chip">
                      <div className="add-person-chip-avatar">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{p.name}</span>
                      <button type="button" className="add-person-chip-remove"
                        onClick={() => togglePerson(p)}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* existing people checklist */}
              {availablePeople.length > 0 && (
                <div className="add-people-list">
                  {availablePeople.map((p) => (
                    <button key={p.id} type="button"
                      className="add-people-row"
                      onClick={() => togglePerson({ id: p.id, name: p.name })}>
                      <div className="add-people-avatar">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="add-people-name">{p.name}</span>
                      <div className="add-people-check">
                        <Check size={11} color="#fff" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* inline add new person */}
              <div className="add-new-person-row">
                <div className="add-new-person-wrap">
                  <UserPlus size={15} color="#9ca3af" />
                  <input
                    type="text"
                    className="add-new-person-input"
                    placeholder="Add new person…"
                    value={newPersonInput}
                    onChange={(e) => setNewPersonInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewPersonInline(); } }}
                  />
                  {newPersonInput.trim() && (
                    <button type="button" className="add-new-person-btn"
                      onClick={addNewPersonInline}>
                      Add
                    </button>
                  )}
                </div>
              </div>

              {/* ── STEP 2: Who paid ── */}
              {selectedPeople.length > 0 && (
                <>
                  <div className="add-step-label">
                    <span className="add-step-num">2</span>
                    <span>Who paid?</span>
                  </div>

                  <div className="add-pills">
                    <button type="button"
                      className={`add-pill ${paidBy === 'me' ? 'active' : ''}`}
                      onClick={() => setPaidBy('me')}>
                      {paidBy === 'me' && <Check size={12} />} I paid
                    </button>
                    {selectedPeople.map((p) => (
                      <button key={p.id} type="button"
                        className={`add-pill ${paidBy === p.id ? 'active' : ''}`}
                        onClick={() => setPaidBy(p.id)}>
                        {paidBy === p.id && <Check size={12} />} {p.name}
                      </button>
                    ))}
                  </div>

                  {/* ── STEP 3: How to split ── */}
                  <div className="add-step-label">
                    <span className="add-step-num">3</span>
                    <span>How to split ₹{numAmount.toLocaleString('en-IN')}?</span>
                  </div>

                  <div className="add-pills">
                    <button type="button"
                      className={`add-pill ${splitMethod === 'equal' ? 'active' : ''}`}
                      onClick={() => setSplitMethod('equal')}>
                      {splitMethod === 'equal' && <Check size={12} />} Equal
                    </button>
                    <button type="button"
                      className={`add-pill ${splitMethod === 'custom' ? 'active' : ''}`}
                      onClick={() => setSplitMethod('custom')}>
                      {splitMethod === 'custom' && <Check size={12} />} Custom
                    </button>
                  </div>

                  {/* custom per-person amount inputs */}
                  {splitMethod === 'custom' && (
                    <div className="add-custom-inputs">
                      {selectedPeople.map((p) => (
                        <div key={p.id} className="add-custom-row">
                          <div className="add-custom-avatar">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="add-custom-name">{p.name}</span>
                          <div className="add-custom-input-wrap">
                            <span className="add-custom-symbol">₹</span>
                            <input
                              type="number"
                              className="add-custom-input"
                              placeholder="0"
                              min="0"
                              max={numAmount}
                              value={customShares[p.id] || ''}
                              onChange={(e) => setCustomShares((cs) => ({ ...cs, [p.id]: e.target.value }))}
                              inputMode="decimal"
                            />
                          </div>
                        </div>
                      ))}
                      {/* remaining indicator */}
                      <div className={`add-remaining ${remaining < 0 ? 'over' : remaining === 0 ? 'done' : ''}`}>
                        {remaining > 0
                          ? <><AlertCircle size={13} /> ₹{remaining.toLocaleString('en-IN')} remaining to assign</>
                          : remaining < 0
                            ? <><AlertCircle size={13} /> ₹{Math.abs(remaining).toLocaleString('en-IN')} over-assigned</>
                            : <><Check size={13} /> Amounts balance perfectly</>
                        }
                      </div>
                    </div>
                  )}

                  {/* ── Live preview ── */}
                  {numAmount > 0 && (
                    <div className="add-split-preview">
                      <div className="add-preview-title">Split breakdown</div>

                      {/* Me */}
                      <div className="add-preview-row">
                        <div className="add-preview-person">
                          <div className="add-preview-avatar me">Y</div>
                          <span>You</span>
                          {paidBy === 'me' && <span className="add-preview-payer-tag">paid</span>}
                        </div>
                        <span className="add-preview-amt">
                          ₹{(shares.me || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Others */}
                      {selectedPeople.map((p) => (
                        <div key={p.id} className="add-preview-row">
                          <div className="add-preview-person">
                            <div className="add-preview-avatar">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{p.name}</span>
                            {paidBy === p.id && <span className="add-preview-payer-tag">paid</span>}
                          </div>
                          <span className="add-preview-amt">
                            ₹{(shares[p.id] || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}

                      <div className="add-preview-divider" />
                      <div className="add-preview-row total">
                        <span>Total</span>
                        <span>₹{numAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Summary sentence */}
                      {paidBy === 'me' && (
                        <div className="add-preview-summary">
                          You paid ₹{numAmount.toLocaleString('en-IN')}.
                          Your share: ₹{(shares.me || 0).toLocaleString('en-IN')}.
                          Others owe you: ₹{(numAmount - (shares.me || 0)).toLocaleString('en-IN')}.
                        </div>
                      )}
                      {paidBy !== 'me' && (
                        <div className="add-preview-summary">
                          {selectedPeople.find((p) => p.id === paidBy)?.name || 'They'} paid.
                          You owe: ₹{(shares.me || 0).toLocaleString('en-IN')}.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <button type="submit" className="add-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Expense'}
          </button>
        </form>
      </div>

      {/* ── Category picker ── */}
      {showCatPicker && (
        <div className="add-cat-overlay" onClick={() => setShowCatPicker(false)}>
          <div className="add-cat-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-cat-sheet-handle" />
            <h3 className="add-cat-sheet-title">Category</h3>
            <div className="add-cat-grid">
              {CATEGORIES.map((cat) => {
                const Icon = CAT_ICONS[cat] || Package;
                const color = getCategoryColor(cat);
                return (
                  <button key={cat} type="button"
                    className={`add-cat-tile ${category === cat ? 'active' : ''}`}
                    onClick={() => { setCategory(cat); setShowCatPicker(false); }}>
                    <div className="add-cat-tile-icon" style={{ background: color + '1f' }}>
                      <Icon size={20} color={color} />
                    </div>
                    <span className="add-cat-tile-label">{cat}</span>
                    {category === cat && (
                      <div className="add-cat-tile-check">
                        <Check size={10} color="#fff" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpense;
