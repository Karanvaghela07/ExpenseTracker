import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import {
  CATEGORIES,
  PAYMENT_METHODS,
  getToday,
  getCategoryClass
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

  // Shared Expense State
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

      // Add new person to Firestore if specified
      if (isShared && sharedWith === 'new' && newPersonName.trim()) {
        await addPerson(newPersonName.trim());
        actualSharedWith = newPersonName.trim();
      }

      // Calculate split amount
      let splitAmountValue = 0;
      if (isShared) {
        const numAmount = Number(amount);
        if (splitType === 'full') splitAmountValue = numAmount;
        else if (splitType === 'half') splitAmountValue = numAmount / 2;
        else splitAmountValue = Number(customSplitAmount) || 0;
      }

      const expense = {
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
      };

      await addExpense(expense);
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
    <div className="page-container add-expense-container">
      <div className="page-header">
        <h1 className="page-title">Add New Expense</h1>
        <p className="page-subtitle">Track what you spent today</p>
      </div>

      <form className="add-expense-form" onSubmit={handleSubmit}>
        <div className="amount-input-wrapper">
          <span className="amount-currency">₹</span>
          <input
            type="number"
            className="amount-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            required
            autoFocus
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Category</label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ paddingLeft: '40px' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div
                className={getCategoryClass(category)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  padding: 0
                }}
              />
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

        <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
          <label className="form-label">Payment Method</label>
          <div className="payment-methods">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method}
                type="button"
                className={`payment-method-btn ${paymentMethod === method ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(method)}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
          <label className="form-label">Note (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Lunch with friends"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-xl)' }}>
          <label className="toggle-wrapper">
            <div className="toggle">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
              />
              <div className="toggle-slider"></div>
            </div>
            <span style={{ fontWeight: 500 }}>Is this expense shared with someone?</span>
          </label>
        </div>

        {isShared && (
          <div className="shared-section">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Person</label>
                <select
                  className="form-select"
                  value={sharedWith}
                  onChange={(e) => setSharedWith(e.target.value)}
                  required={isShared}
                >
                  <option value="">Select person...</option>
                  {state.people.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  <option value="new">+ Add New Person</option>
                </select>
              </div>

              {sharedWith === 'new' && (
                <div className="form-group">
                  <label className="form-label">New Person Name</label>
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
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label">Who Paid?</label>
              <div className="split-type-options">
                <button
                  type="button"
                  className={`split-type-btn ${whoPaid === 'I paid for them' ? 'selected' : ''}`}
                  onClick={() => setWhoPaid('I paid for them')}
                >
                  I paid
                </button>
                <button
                  type="button"
                  className={`split-type-btn ${whoPaid === 'They paid for me' ? 'selected' : ''}`}
                  onClick={() => setWhoPaid('They paid for me')}
                >
                  They paid
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label">Split Amount</label>
              <div className="split-type-options">
                <button
                  type="button"
                  className={`split-type-btn ${splitType === 'full' ? 'selected' : ''}`}
                  onClick={() => setSplitType('full')}
                >
                  Full (₹{amount || 0})
                </button>
                <button
                  type="button"
                  className={`split-type-btn ${splitType === 'half' ? 'selected' : ''}`}
                  onClick={() => setSplitType('half')}
                >
                  Half (₹{amount ? (Number(amount) / 2).toFixed(2) : 0})
                </button>
                <button
                  type="button"
                  className={`split-type-btn ${splitType === 'custom' ? 'selected' : ''}`}
                  onClick={() => setSplitType('custom')}
                >
                  Custom
                </button>
              </div>
            </div>

            {splitType === 'custom' && (
              <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '12px', color: 'var(--text-secondary)' }}>₹</span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '32px' }}
                    placeholder="Enter custom amount"
                    value={customSplitAmount}
                    onChange={(e) => setCustomSplitAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
