import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Wallet, ShoppingBag, Heart, ShoppingCart, Coffee, Train, Home, BookOpen, Utensils, Package } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import {
  formatCurrency,
  CATEGORIES,
  isThisMonth,
} from '../../utils/helpers';
import './Budget.css';

const CAT_META = {
  Food:          { icon: Utensils,    color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  Travel:        { icon: Train,       color: '#0ea5e9', bg: 'rgba(56,189,248,0.15)' },
  Groceries:     { icon: ShoppingCart,color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  'Rent/Bills':  { icon: Home,        color: '#238ea3', bg: 'rgba(57,185,207,0.15)' },
  Shopping:      { icon: ShoppingBag, color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  Entertainment: { icon: Coffee,      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  Health:        { icon: Heart,       color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  Education:     { icon: BookOpen,    color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'  },
  Other:         { icon: Package,     color: '#64748b', bg: 'rgba(100,116,139,0.15)'},
};

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

  const overallStatus = usedPct >= 100 ? 'danger' : usedPct >= 80 ? 'warning' : 'safe';

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

  const activeCats = CATEGORIES.filter((cat) => (budgets[cat] || 0) > 0 || categorySpending[cat] > 0);

  return (
    <div className="budg-root">
      {/* ── Hero ── */}
      <div className="bank-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="bank-hero-title">Budget</h1>
          <div className="bank-icon-btn" aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <Wallet size={18} />
          </div>
        </div>

        <p className="bank-hero-sub">This month's limits & pacing</p>
        <div className="bank-hero-value">{formatCurrency(totalBudget)}</div>
        <div className="bank-hero-pills">
          <span className="bank-hero-pill">Spent {formatCurrency(totalSpent)}</span>
          <span className="bank-hero-pill">
            {remaining >= 0 ? 'Left' : 'Over'} {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>

      <div className="bank-sheet budg-sheet">
        {/* Overall Overview */}
        <div className="budg-overview">
          <div className="budg-overview-top">
            <span className="budg-overview-label">Overall Progress</span>
            <span className={`budg-overview-pct ${overallStatus}`}>{Math.round(usedPct)}%</span>
          </div>
          <div className="progress-bar budg-bar">
            <div
              className={`progress-bar-fill ${overallStatus === 'danger' ? 'danger' : overallStatus === 'warning' ? 'warning' : ''}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="budg-overview-sub">
            <span>🏦 Budget: {formatCurrency(totalBudget)}</span>
            <span>·</span>
            <span>💳 Spent: {formatCurrency(totalSpent)}</span>
          </div>
        </div>

        {/* Category Progress */}
        {activeCats.length > 0 && (
          <>
            <div className="bank-section-head">
              <h2>Category Progress</h2>
            </div>
            <div className="budg-list">
              {activeCats.map((cat) => {
                const meta = CAT_META[cat] || CAT_META.Other;
                const CatIcon = meta.icon;
                const spent = categorySpending[cat];
                const limit = budgets[cat] || 0;
                const percent = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
                const isWarning = percent >= 80 && percent < 100;
                const isDanger = percent >= 100;

                return (
                  <div key={cat} className="budg-item">
                    <div className="budg-item-header">
                      <div className="budg-item-cat">
                        <div className="budg-item-icon" style={{ background: meta.bg, color: meta.color }}>
                          <CatIcon size={16} />
                        </div>
                        <span className="budg-item-name">{cat}</span>
                      </div>
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
                        <AlertTriangle size={12} /> {Math.round(percent)}% used — almost there!
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
          </>
        )}

        {/* Edit Budgets Form */}
        <div className="bank-section-head" style={{ marginTop: 24 }}>
          <h2>Set Monthly Budgets</h2>
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
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 15 }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : '💾 Save Budgets'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Budget;
