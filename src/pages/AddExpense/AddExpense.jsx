import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  getToday,
  getCategoryColor,
} from '../../utils/helpers';
import './AddExpense.css';

const AddExpense = () => {
  const { state, addExpense, addPerson } = useExpense();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(getToday());
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [note, setNote] = useState('');

  const [isShared, setIsShared] = useState(false);
  const [sharedWith, setSharedWith] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [whoPaid, setWhoPaid] = useState('I paid for them');
  const [splitType, setSplitType] = useState('full');
  const [customSplitAmount, setCustomSplitAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    if (isShared && !sharedWith && !newPersonName) {
      addToast('Please select or add a person', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let actualSharedWith = sharedWith;
      if (isShared && sharedWith === 'new' && newPersonName.trim()) {
        await addPerson(newPersonName.trim());
        actualSharedWith = newPersonName.trim();
      }

      let splitAmountValue = 0;
      if (isShared) {
        const numAmount = Number(amount);
        if (splitType === 'full') splitAmountValue = numAmount;
        else if (splitType === 'half') splitAmountValue = numAmount / 2;
        else splitAmountValue = Number(customSplitAmount) || 0;
      }

      await addExpense({
        amount: Number(amount),
        category,
        date,
        paymentMethod,
        note,
        isShared,
        sharedWith: isShared ? actualSharedWith : '',
        whoPaid: isShared ? whoPaid : '',
        splitAmount: splitAmountValue,
        settledUp: false,
      });
      addToast('Expense added successfully!', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      addToast('Failed to save expense. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container bank-page">
      <div className="bank-hero add-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <span className="add-hero-label">New expense</span>
          <span style={{ width: 40 }} />
        </div>

        <div className="add-amount-wrap">
          <span className="add-currency">₹</span>
          <input
            type="number"
            className="add-amount-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            required
            autoFocus
          />
        </div>
        <p className="bank-hero-sub" style={{ textAlign: 'center' }}>Enter amount spent</p>
      </div>

      <div className="bank-sheet">
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="add-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="add-cat-wrap">
                <span className="add-cat-dot" style={{ background: getCategoryColor(category) }} />
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment method</label>
            <div className="add-pills">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`add-pill ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Lunch with friends"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <label className="add-toggle">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
            />
            <span className="add-toggle-ui" />
            <span>Shared with someone?</span>
          </label>

          {isShared && (
            <div className="add-shared">
              <div className="form-group">
                <label className="form-label">Person</label>
                <select
                  className="form-select"
                  value={sharedWith}
                  onChange={(e) => setSharedWith(e.target.value)}
                  required={isShared}
                >
                  <option value="">Select person...</option>
                  {state.people.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  <option value="new">+ Add New Person</option>
                </select>
              </div>

              {sharedWith === 'new' && (
                <div className="form-group">
                  <label className="form-label">New person name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Who paid?</label>
                <div className="add-pills">
                  <button
                    type="button"
                    className={`add-pill ${whoPaid === 'I paid for them' ? 'active' : ''}`}
                    onClick={() => setWhoPaid('I paid for them')}
                  >
                    I paid
                  </button>
                  <button
                    type="button"
                    className={`add-pill ${whoPaid === 'They paid for me' ? 'active' : ''}`}
                    onClick={() => setWhoPaid('They paid for me')}
                  >
                    They paid
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Split amount</label>
                <div className="add-pills">
                  <button
                    type="button"
                    className={`add-pill ${splitType === 'full' ? 'active' : ''}`}
                    onClick={() => setSplitType('full')}
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    className={`add-pill ${splitType === 'half' ? 'active' : ''}`}
                    onClick={() => setSplitType('half')}
                  >
                    Half
                  </button>
                  <button
                    type="button"
                    className={`add-pill ${splitType === 'custom' ? 'active' : ''}`}
                    onClick={() => setSplitType('custom')}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {splitType === 'custom' && (
                <div className="form-group">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Custom split amount"
                    value={customSplitAmount}
                    onChange={(e) => setCustomSplitAmount(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
