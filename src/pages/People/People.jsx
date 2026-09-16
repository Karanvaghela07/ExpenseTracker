import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import Modal from '../../components/Modal/Modal';
import {
  formatCurrency,
  calculateBalances,
  formatDateShort
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
      (a, b) => Math.abs(b.balance) - Math.abs(a.balance)
    );
  }, [state.people, state.expenses]);

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
      .filter(e => e.isShared && e.sharedWith === personName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">People & Balances</h1>
          <p className="page-subtitle">Keep track of who owes who</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/add')}>
          Add Shared Expense
        </button>
      </div>

      <div className="people-grid">
        {peopleWithBalances.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-xl)' }}>
            No people yet. Add a shared expense to get started.
          </div>
        )}
        {peopleWithBalances.map(person => {
          const isOwed = person.balance > 0;
          const isOwe = person.balance < 0;
          const isSettled = person.balance === 0;

          let cardClass = 'person-card';
          if (isOwed) cardClass += ' owed-to-you';
          if (isOwe) cardClass += ' you-owe';

          let statusText = 'Settled up';
          let statusColor = 'var(--text-secondary)';
          if (isOwed) { statusText = 'Owes you'; statusColor = 'var(--color-success)'; }
          if (isOwe)  { statusText = 'You owe';  statusColor = 'var(--color-danger)'; }

          return (
            <div key={person.id} className={cardClass} onClick={() => handlePersonClick(person)}>
              <div className="person-card-header">
                <div className="person-avatar">{person.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="person-name">{person.name}</div>
                  <div className="person-transactions">{person.transactionCount} transactions</div>
                </div>
              </div>

              <div className="person-balance">
                <div className="balance-status" style={{ color: statusColor }}>{statusText}</div>
                <div className="balance-amount" style={{ color: isSettled ? 'var(--text-primary)' : statusColor }}>
                  {formatCurrency(Math.abs(person.balance))}
                </div>
              </div>

              {!isSettled && (
                <div className="person-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={(e) => handleSettleClick(person, e)}
                  >
                    Settle Up
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Person Detail Modal */}
      {selectedPerson && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Transactions with ${selectedPerson.name}`}
          footer={
            <>
              {selectedPerson.balance !== 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => { setDetailModalOpen(false); setSettleModalOpen(true); }}
                >
                  Settle Up
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailModalOpen(false)}>Close</button>
            </>
          }
        >
          <div className="person-balance" style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div className="balance-status" style={{
              color: selectedPerson.balance > 0 ? 'var(--color-success)' : selectedPerson.balance < 0 ? 'var(--color-danger)' : 'var(--text-secondary)'
            }}>
              {selectedPerson.balance > 0 ? 'Owes you' : selectedPerson.balance < 0 ? 'You owe' : 'Settled up'}
            </div>
            <div className="balance-amount" style={{
              color: selectedPerson.balance > 0 ? 'var(--color-success)' : selectedPerson.balance < 0 ? 'var(--color-danger)' : 'var(--text-primary)'
            }}>
              {formatCurrency(Math.abs(selectedPerson.balance))}
            </div>
          </div>

          <div className="transactions-list">
            {getPersonTransactions(selectedPerson.name).map(t => {
              const amount = t.splitAmount || t.amount;
              const isYouPaid = t.whoPaid === 'I paid for them';
              return (
                <div key={t.id} className="transaction-item" style={{ opacity: t.settledUp ? 0.5 : 1 }}>
                  <div className="transaction-info">
                    <div className="transaction-note">{t.note || t.category}</div>
                    <div className="transaction-meta">{formatDateShort(t.date)} • {t.settledUp ? 'Settled' : 'Pending'}</div>
                  </div>
                  <div className="transaction-amount-col">
                    <div className="transaction-amount" style={{ color: isYouPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="transaction-direction" style={{ color: isYouPaid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {isYouPaid ? 'You lent' : 'You borrowed'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Settle Up Confirmation Modal */}
      {selectedPerson && (
        <Modal
          isOpen={settleModalOpen}
          onClose={() => setSettleModalOpen(false)}
          title="Confirm Settlement"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setSettleModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSettle} disabled={isSettling}>
                {isSettling ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </>
          }
        >
          <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-md)' }}>
              Mark <strong>{formatCurrency(Math.abs(selectedPerson.balance))}</strong> as settled with <strong>{selectedPerson.name}</strong>?
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              This will mark all pending transactions with {selectedPerson.name} as settled.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default People;
