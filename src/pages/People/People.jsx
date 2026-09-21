import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import {
  formatCurrency,
  calculateBalances,
  formatDateShort,
} from '../../utils/helpers';
import './People.css';

const People = () => {
  const { state, settleUp } = useExpense();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const peopleWithBalances = useMemo(() => {
    return calculateBalances(state.people, state.expenses).sort(
      (a, b) => Math.abs(b.balance) - Math.abs(a.balance),
    );
  }, [state.people, state.expenses]);

  const totalOwed = peopleWithBalances.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalOwe = peopleWithBalances.filter((p) => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);

  const handlePersonClick = (person) => {
    setSelectedPerson(person);
    setDetailModalOpen(true);
  };

  const handleSettleClick = (person, e) => {
    e.stopPropagation();
    setSelectedPerson(person);
    setSettleModalOpen(true);
  };

  const confirmSettle = async () => {
    if (!selectedPerson) return;
    setIsSettling(true);
    try {
      await settleUp(selectedPerson.name);
      addToast(`Settled up with ${selectedPerson.name}`, 'success');
      setSettleModalOpen(false);
      setDetailModalOpen(false);
      setSelectedPerson(null);
    } catch (err) {
      console.error(err);
      addToast('Failed to settle up. Please try again.', 'error');
    } finally {
      setIsSettling(false);
    }
  };

  const getPersonTransactions = (personName) => {
    return state.expenses
      .filter((e) => {
        if (!e.isShared) return false;
        // new format
        if (Array.isArray(e.splitWith) && e.splitWith.length > 0) {
          return e.splitWith.some((sw) => sw.name?.toLowerCase() === personName.toLowerCase());
        }
        // legacy
        const names = (e.sharedWith || '').split(',').map((n) => n.trim());
        return names.some((n) => n.toLowerCase() === personName.toLowerCase());
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getPersonShare = (expense, personName) => {
    if (Array.isArray(expense.splitWith) && expense.splitWith.length > 0) {
      const iPaid = expense.whoPaid === 'I paid for them';
      if (iPaid) {
        // I paid → show what this person owes me (their share)
        const entry = expense.splitWith.find(
          (sw) => sw.name?.toLowerCase() === personName.toLowerCase()
        );
        return entry ? Number(entry.shareAmount) : expense.splitAmount || expense.amount;
      } else {
        // They (or someone) paid → show MY share (what I owe)
        const othersTotal = expense.splitWith.reduce((s, sw) => s + (Number(sw.shareAmount) || 0), 0);
        return Math.max(0, Number(expense.amount) - othersTotal);
      }
    }
    return expense.splitAmount || expense.amount;
  };

  return (
    <div className="page-container bank-page">
      <div className="bank-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="bank-icon-btn" onClick={() => navigate('/add')} aria-label="Add shared">
            <Plus size={18} />
          </button>
        </div>
        <h1 className="bank-hero-title">People</h1>
        <p className="bank-hero-sub">Who owes who</p>
        <div className="bank-hero-pills">
          <span className="bank-hero-pill">Owed to you {formatCurrency(totalOwed)}</span>
          <span className="bank-hero-pill">You owe {formatCurrency(totalOwe)}</span>
        </div>
      </div>

      <div className="bank-sheet people-sheet">
        <div className="bank-section-head">
          <h2>Balances</h2>
          <button type="button" className="people-add-link" onClick={() => navigate('/add')}>
            Add shared
          </button>
        </div>

        {peopleWithBalances.length === 0 ? (
          <div className="people-empty">
            <Users size={28} strokeWidth={1.5} />
            <p>No people yet. Add a shared expense to get started.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/add')}>
              Add Shared Expense
            </button>
          </div>
        ) : (
          <div className="people-list">
            {peopleWithBalances.map((person) => {
              const isOwed = person.balance > 0;
              const isOwe = person.balance < 0;
              const isSettled = person.balance === 0;
              let statusText = 'Settled up';
              let statusClass = 'settled';
              if (isOwed) { statusText = 'Owes you'; statusClass = 'owed'; }
              if (isOwe) { statusText = 'You owe'; statusClass = 'owe'; }

              return (
                <button
                  type="button"
                  key={person.id}
                  className="people-card"
                  onClick={() => handlePersonClick(person)}
                >
                  <div className="people-avatar">{person.name.charAt(0).toUpperCase()}</div>
                  <div className="people-info">
                    <div className="people-name">{person.name}</div>
                    <div className={`people-status ${statusClass}`}>{statusText}</div>
                  </div>
                  <div className="people-right">
                    <div className={`people-amt ${statusClass}`}>
                      {formatCurrency(Math.abs(person.balance))}
                    </div>
                    {!isSettled && (
                      <span
                        className="people-settle"
                        onClick={(e) => handleSettleClick(person, e)}
                        onKeyDown={() => {}}
                        role="presentation"
                      >
                        Settle
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPerson && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`With ${selectedPerson.name}`}
          footer={(
            <>
              {selectedPerson.balance !== 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setDetailModalOpen(false); setSettleModalOpen(true); }}
                >
                  Settle Up
                </button>
              )}
            </>
          )}
        >
          <div className="people-modal-balance">
            <div className="people-status">
              {selectedPerson.balance > 0 ? 'Owes you' : selectedPerson.balance < 0 ? 'You owe' : 'Settled up'}
            </div>
            <div className="people-modal-amt">
              {formatCurrency(Math.abs(selectedPerson.balance))}
            </div>
          </div>

          <div className="people-txns">
            {getPersonTransactions(selectedPerson.name).map((t) => {
              const amount = getPersonShare(t, selectedPerson.name);
              // iPaid = true means I paid → I lent money → they owe me
              // iPaid = false means they (or someone) paid → I owe them
              const iPaid = t.whoPaid === 'I paid for them';
              const personPaid = !iPaid && t.whoPaid?.toLowerCase().includes(selectedPerson.name.toLowerCase());
              const isSettled = t.settledUp ||
                (Array.isArray(t.splitWith) &&
                  t.splitWith.find((sw) => sw.name?.toLowerCase() === selectedPerson.name.toLowerCase())?.settledUp);
              return (
                <div key={t.id} className="bank-row" style={{ opacity: isSettled ? 0.5 : 1 }}>
                  <div className="bank-row-body">
                    <div className="bank-row-title">{t.note || t.category}</div>
                    <div className="bank-row-meta">
                      {formatDateShort(t.date)} · {isSettled ? 'Settled' : 'Pending'}
                      {Array.isArray(t.splitWith) && t.splitWith.length > 1 && (
                        <span> · {t.splitWith.length} people</span>
                      )}
                    </div>
                  </div>
                  <div className="bank-row-right">
                    <div className="bank-row-amt" style={{ color: iPaid ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="bank-row-meta" style={{ color: iPaid ? '#10b981' : '#ef4444' }}>
                      {iPaid ? 'You lent' : 'You owe'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {selectedPerson && (
        <Modal
          isOpen={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          title="Confirm Settlement"
          footer={(
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setSettleModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmSettle} disabled={isSettling}>
                {isSettling ? 'Settling...' : 'Confirm'}
              </button>
            </>
          )}
        >
          <p style={{ textAlign: 'center', margin: 0 }}>
            Mark <strong>{formatCurrency(Math.abs(selectedPerson.balance))}</strong> as settled with{' '}
            <strong>{selectedPerson.name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default People;
