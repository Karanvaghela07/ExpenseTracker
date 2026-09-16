import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import {
  formatCurrency,
  CATEGORIES,
  getCategoryClass,
  isThisMonth
} from '../../utils/helpers';
import './Budget.css';

const Budget = () => {
  const { state, saveBudgets } = useExpense();
  const { addToast } = useToast();

  const [budgets, setBudgets] = useState(state.budgets);
  const [isSaving, setIsSaving] = useState(false);

  // Keep local budgets in sync when Firestore data loads
  // (handles the case where budgets arrive after initial render)
  useMemo(() => {
    setBudgets(state.budgets);
  }, [state.budgets]);

  const categorySpending = useMemo(() => {
    const spending = {};
    CATEGORIES.forEach(cat => (spending[cat] = 0));
    state.expenses.filter(e => isThisMonth(e.date)).forEach(e => {
      spending[e.category] = (spending[e.category] || 0) + Number(e.amount);
    });
    return spending;
  }, [state.expenses]);

  const totalBudget = Object.values(budgets).reduce((sum, val) => sum + Number(val || 0), 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);

  const handleBudgetChange = (category, value) => {
    setBudgets(prev => ({
      ...prev,
      [category]: value === '' ? '' : Number(value),
    }));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanBudgets = {};
    Object.keys(budgets).forEach(k => {
      cleanBudgets[k] = Number(budgets[k]) || 0;
    });

    try {
      await saveBudgets(cleanBudgets);
      addToast('Budgets saved successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to save budgets', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Monthly Budget</h1>
        <p className="page-subtitle">Set limits and track your pacing</p>
      </div>

      <div className="budget-summary">
        <div className="flex-between">
          <div>
            <div className="budget-summary-label">Total Monthly Budget</div>
            <div className="budget-summary-value">{formatCurrency(totalBudget)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="budget-summary-label">Total Spent</div>
            <div
              className="budget-summary-value"
              style={{ color: totalSpent > totalBudget ? 'var(--color-danger)' : 'inherit' }}
            >
              {formatCurrency(totalSpent)}
            </div>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 'var(--space-md)', height: 12, background: 'rgba(0,0,0,0.2)' }}>
          <div
            className={`progress-bar-fill ${totalSpent > totalBudget ? 'danger' : totalSpent > totalBudget * 0.8 ? 'warning' : ''}`}
            style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="budget-grid">
        <div className="budget-list-card">
          <h2 className="section-title">Category Progress</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
            {CATEGORIES.map(cat => {
              const spent = categorySpending[cat];
              const limit = state.budgets[cat] || 0;
              const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;

              const isWarning = percent >= 80 && percent < 100;
              const isDanger = percent >= 100;

              if (limit === 0 && spent === 0) return null;

              return (
                <div key={cat} className="budget-item">
                  <div className="budget-item-header">
                    <div className="budget-item-name">
                      <span className={`badge ${getCategoryClass(cat)}`} style={{ padding: '2px 8px' }}>{cat}</span>
                    </div>
                    <div className="budget-item-amounts">
                      <span className="budget-spent">{formatCurrency(spent)}</span>
                      <span className="budget-limit"> / {formatCurrency(limit)}</span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>

                  {isWarning && (
                    <div className="budget-warning-text warning">
                      <AlertTriangle size={12} /> You've used {Math.round(percent)}% of your {cat} budget.
                    </div>
                  )}
                  {isDanger && limit > 0 && (
                    <div className="budget-warning-text danger">
                      <AlertTriangle size={12} /> Over budget by {formatCurrency(spent - limit)}.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="budget-form-card" style={{ animationDelay: '100ms' }}>
          <h2 className="section-title">Edit Budgets</h2>
          <form onSubmit={handleSaveBudget}>
            <div className="budget-form-grid">
              {CATEGORIES.map(cat => (
                <div key={cat} className="budget-input-group">
                  <div className="budget-input-label">
                    <span className={`badge ${getCategoryClass(cat)}`} style={{ padding: '2px 8px' }}>{cat}</span>
                  </div>
                  <div className="budget-input-wrapper">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={budgets[cat] === 0 ? '' : (budgets[cat] || '')}
                      onChange={(e) => handleBudgetChange(cat, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Budgets'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Budget;
