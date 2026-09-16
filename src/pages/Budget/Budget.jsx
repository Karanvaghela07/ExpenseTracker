import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Wallet } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import {
  formatCurrency,
  CATEGORIES,
  getCategoryClass,
  isThisMonth,
} from '../../utils/helpers';
import './Budget.css';

const Budget = () => {
  const { state, saveBudgets } = useExpense();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState(state.budgets);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setBudgets(state.budgets);
  }, [state.budgets]);

  const categorySpending = useMemo(() => {
    const spending = {};
    CATEGORIES.forEach((cat) => { spending[cat] = 0; });
    state.expenses.filter((e) => isThisMonth(e.date)).forEach((e) => {
      spending[e.category] = (spending[e.category] || 0) + Number(e.amount);
    });
    return spending;
  }, [state.expenses]);

  const totalBudget = Object.values(budgets).reduce((sum, val) => sum + Number(val || 0), 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
  const remaining = totalBudget - totalSpent;
  const usedPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const handleBudgetChange = (category, value) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: value === '' ? '' : Number(value),
    }));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const cleanBudgets = {};
    Object.keys(budgets).forEach((k) => {
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
    <div className="page-container bank-page">
      <div className="bank-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="bank-icon-btn" aria-hidden="true">
            <Wallet size={18} />
          </div>
        </div>
        <h1 className="bank-hero-title">Budget</h1>
        <p className="bank-hero-sub">This month&apos;s limits &amp; pacing</p>
        <div className="bank-hero-value">{formatCurrency(totalBudget)}</div>
        <div className="bank-hero-pills">
          <span className="bank-hero-pill">Spent {formatCurrency(totalSpent)}</span>
          <span className="bank-hero-pill">
            {remaining >= 0 ? 'Left' : 'Over'} {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>

      <div className="bank-sheet budg-sheet">
        <div className="budg-overview">
          <div className="budg-overview-top">
            <span>Overall progress</span>
            <span>{Math.round(usedPct)}%</span>
          </div>
          <div className="progress-bar budg-bar">
            <div
              className={`progress-bar-fill ${totalSpent > totalBudget ? 'danger' : totalSpent > totalBudget * 0.8 ? 'warning' : ''}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>

        <div className="bank-section-head">
          <h2>Category progress</h2>
        </div>

        <div className="budg-list">
          {CATEGORIES.map((cat) => {
            const spent = categorySpending[cat];
            const limit = state.budgets[cat] || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
            const isWarning = percent >= 80 && percent < 100;
            const isDanger = percent >= 100;
            if (limit === 0 && spent === 0) return null;

            return (
              <div key={cat} className="budg-item">
                <div className="budg-item-header">
                  <span className={`badge ${getCategoryClass(cat)}`}>{cat}</span>
                  <div className="budg-item-amounts">
                    <span className="budg-spent">{formatCurrency(spent)}</span>
                    <span className="budg-limit"> / {formatCurrency(limit)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${isDanger ? 'danger' : isWarning ? 'warning' : ''}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                {isWarning && (
                  <div className="budg-warn warning">
                    <AlertTriangle size={12} /> {Math.round(percent)}% used
                  </div>
                )}
                {isDanger && limit > 0 && (
                  <div className="budg-warn danger">
                    <AlertTriangle size={12} /> Over by {formatCurrency(spent - limit)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bank-section-head" style={{ marginTop: 28 }}>
          <h2>Edit budgets</h2>
        </div>

        <form onSubmit={handleSaveBudget} className="budg-form">
          <div className="budg-form-grid">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="budg-input-group">
                <label className="form-label">{cat}</label>
                <div className="budg-input-wrap">
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
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Budgets'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Budget;
