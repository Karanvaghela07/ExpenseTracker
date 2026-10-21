import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Heart, Dumbbell, ShoppingCart,
  Coffee, Train, Home, BookOpen, Utensils, Package,
  ArrowLeft, Calendar, TrendingUp, TrendingDown,
  Wallet, Target, CreditCard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useExpense } from '../../context/ExpenseContext';
import {
  formatCurrency,
  formatDateShort,
  getTopCategories,
  getMonthSpend,
  getLastMonthSpend,
  getAverageDailySpend,
  getSpendingPrediction,
  getLast30DaysTrend,
  getCategoryClass,
  getCategoryColor,
  PAYMENT_METHODS,
  sumExpenses,
  isThisMonth,
} from '../../utils/helpers';
import './Reports.css';

const CAT_META = {
  Food: { icon: Utensils, color: '#f97316' },
  Travel: { icon: Train, color: '#3b82f6' },
  Groceries: { icon: ShoppingCart, color: '#10b981' },
  'Rent/Bills': { icon: Home, color: '#238ea3' },
  Shopping: { icon: ShoppingBag, color: '#ec4899' },
  Entertainment: { icon: Coffee, color: '#f59e0b' },
  Health: { icon: Heart, color: '#ef4444' },
  Education: { icon: BookOpen, color: '#06b6d4' },
  Other: { icon: Package, color: '#64748b' },
  Sport: { icon: Dumbbell, color: '#22c55e' },
};

const formatParts = (amount) => {
  const n = Math.max(0, Number(amount) || 0);
  const [whole, frac = '00'] = n.toFixed(2).split('.');
  return {
    symbol: '₹',
    whole: new Intl.NumberFormat('en-IN').format(Number(whole)),
    frac,
  };
};

const monthLabel = () =>
  new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const Reports = () => {
  const { state } = useExpense();
  const navigate = useNavigate();
  const [showMonth, setShowMonth] = useState(true);

  const total = getMonthSpend(state.expenses);
  const lastMonth = getLastMonthSpend(state.expenses);
  const avgDaily = getAverageDailySpend(state.expenses);
  const prediction = getSpendingPrediction(state.expenses);
  const allCats = getTopCategories(state.expenses, 6);
  const top2 = getTopCategories(state.expenses, 2);
  const trend = getLast30DaysTrend(state.expenses);

  // ── My actual personal spend ──
  // total - what others owe me (I paid but they need to pay back)
  const totalOwedToMe = useMemo(() => {
    return state.expenses
      .filter((e) => isThisMonth(e.date) && e.isShared && !e.settledUp)
      .reduce((sum, e) => {
        // New format: sum shareAmounts of all splitWith members
        if (Array.isArray(e.splitWith) && e.splitWith.length > 0) {
          const owedFromThis = e.splitWith
            .filter((sw) => !sw.settledUp)
            .reduce((s, sw) => s + (Number(sw.shareAmount) || 0), 0);
          return sum + owedFromThis;
        }
        // Legacy: whoPaid = 'I paid for them' → splitAmount is what they owe
        if (e.whoPaid === 'I paid for them') {
          return sum + (Number(e.splitAmount) || 0);
        }
        return sum;
      }, 0);
  }, [state.expenses]);

  const myActualSpend = Math.max(0, total - totalOwedToMe);
  const recent = useMemo(
    () => [...state.expenses]
      .filter((e) => isThisMonth(e.date))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6),
    [state.expenses],
  );

  const paymentBreakdown = useMemo(() => {
    const monthExps = state.expenses.filter((e) => isThisMonth(e.date));
    return PAYMENT_METHODS.map((method) => {
      const value = sumExpenses(monthExps.filter((e) => e.paymentMethod === method));
      return { method, value };
    })
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [state.expenses]);

  const pctChange = lastMonth > 0
    ? (((total - lastMonth) / lastMonth) * 100)
    : 0;
  const isUp = pctChange > 0;
  const totalParts = formatParts(total);

  return (
    <div className="rpt-root bank-page">
      <div className="bank-hero rpt-bank-hero">
        <div className="bank-topbar">
          <button type="button" className="bank-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="bank-hero-title">Reports</h1>
          <button
            type="button"
            className="bank-icon-btn"
            onClick={() => setShowMonth((v) => !v)}
            aria-label="Toggle reporting period"
          >
            <Calendar size={18} />
          </button>
        </div>
        <p className="bank-hero-sub">{showMonth ? monthLabel() : 'Monthly spending overview'}</p>
        <div className="bank-hero-value">{formatCurrency(total)}</div>
        <div className="bank-hero-pills">
          <span className="bank-hero-pill">Daily avg {formatCurrency(avgDaily)}</span>
          <span className="bank-hero-pill">{allCats.length} categories</span>
        </div>
      </div>

      {/* ── white bottom sheet ── */}
      <div className="rpt-sheet">
        <div className="rpt-sheet-header">
          <span className="rpt-sheet-title">Expenses</span>
          <Link to="/history" className="rpt-sheet-link">View All</Link>
        </div>

        <div className="rpt-sheet-total">
          <span className="rpt-total-symbol">{totalParts.symbol}</span>
          <span className="rpt-total-whole">{totalParts.whole}</span>
          <span className="rpt-total-frac">.{totalParts.frac}</span>
        </div>

        {/* ── My actual spend box ── */}
        <div className="rpt-actual-box">
          <div className="rpt-actual-left">
            <div className="rpt-actual-label">My actual spend</div>
            <div className="rpt-actual-sub">Total minus what others owe you</div>
          </div>
          <div className="rpt-actual-right">
            <div className="rpt-actual-amt">
              {formatCurrency(myActualSpend)}
            </div>
            {totalOwedToMe > 0 && (
              <div className="rpt-actual-owed">
                −{formatCurrency(totalOwedToMe)} owed back
              </div>
            )}
          </div>
        </div>

        {/* top category tiles */}
        <div className="rpt-sheet-cats">
          {top2.length === 0 ? (
            <div className="rpt-sheet-cat rpt-sheet-cat--empty">No categories yet</div>
          ) : (
            top2.map((cat) => {
              const meta = CAT_META[cat.name] || CAT_META.Other;
              const Icon = meta.icon;
              const parts = formatParts(cat.value);
              return (
                <div key={cat.name} className="rpt-sheet-cat">
                  <div className="rpt-sheet-cat-row">
                    <span className="rpt-sheet-cat-name">{cat.name}</span>
                    <Icon size={15} color="#9aa3b8" strokeWidth={1.75} />
                  </div>
                  <div className="rpt-sheet-cat-amt">
                    <span>{parts.symbol}{parts.whole}</span>
                    <span className="rpt-sheet-cat-frac">.{parts.frac}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* insight stats */}
        <div className="rpt-insights">
          <div className="rpt-insight">
            <div className="rpt-insight-icon">
              <Wallet size={16} />
            </div>
            <div>
              <div className="rpt-insight-label">Daily avg</div>
              <div className="rpt-insight-value">{formatCurrency(avgDaily)}</div>
            </div>
          </div>
          <div className="rpt-insight">
            <div className={`rpt-insight-icon ${isUp ? 'down' : 'up'}`}>
              {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
            <div>
              <div className="rpt-insight-label">vs last month</div>
              <div className={`rpt-insight-value ${isUp ? 'neg' : 'pos'}`}>
                {isUp ? '+' : ''}{pctChange.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="rpt-insight">
            <div className="rpt-insight-icon">
              <Target size={16} />
            </div>
            <div>
              <div className="rpt-insight-label">Forecast</div>
              <div className="rpt-insight-value">{formatCurrency(prediction)}</div>
            </div>
          </div>
        </div>

        {/* 30-day trend */}
        <section className="rpt-section">
          <div className="rpt-section-header">
            <h3 className="rpt-section-title">Spending trend</h3>
            <span className="rpt-section-meta">Last 30 days</span>
          </div>
          <div className="rpt-chart">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rptTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2662e8" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2662e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9aa3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#0f1729',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  formatter={(v) => [formatCurrency(v), 'Spent']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#2662e8"
                  strokeWidth={2.2}
                  fill="url(#rptTrendFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2662e8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* all categories */}
        <section className="rpt-section">
          <div className="rpt-section-header">
            <h3 className="rpt-section-title">By category</h3>
            <span className="rpt-section-meta">{allCats.length} categories</span>
          </div>
          <div className="rpt-cat-list">
            {allCats.map((cat) => {
              const meta = CAT_META[cat.name] || CAT_META.Other;
              const Icon = meta.icon;
              const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={cat.name} className="rpt-cat-row">
                  <div className="rpt-cat-icon" style={{ background: `${meta.color}1f` }}>
                    <Icon size={16} color={meta.color} />
                  </div>
                  <div className="rpt-cat-info">
                    <div className="rpt-cat-label">{cat.name}</div>
                    <div className="rpt-cat-bar-wrap">
                      <div
                        className="rpt-cat-bar"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                  <div className="rpt-cat-right">
                    <div className="rpt-cat-amt">{formatCurrency(cat.value)}</div>
                    <div className="rpt-cat-pct">{pct}%</div>
                  </div>
                </div>
              );
            })}
            {allCats.length === 0 && (
              <p className="rpt-muted">No spending data this month.</p>
            )}
          </div>
        </section>

        {/* payment methods */}
        {paymentBreakdown.length > 0 && (
          <section className="rpt-section">
            <div className="rpt-section-header">
              <h3 className="rpt-section-title">Payment methods</h3>
              <CreditCard size={15} color="#9aa3b8" />
            </div>
            <div className="rpt-pay-list">
              {paymentBreakdown.map((p) => {
                const pct = total > 0 ? ((p.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={p.method} className="rpt-pay-row">
                    <div className="rpt-pay-left">
                      <span className="rpt-pay-name">{p.method}</span>
                      <span className="rpt-pay-pct">{pct}%</span>
                    </div>
                    <span className="rpt-pay-amt">{formatCurrency(p.value)}</span>
                    <div className="rpt-pay-bar-wrap">
                      <div className="rpt-pay-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* recent activity */}
        <section className="rpt-section">
          <div className="rpt-section-header">
            <h3 className="rpt-section-title">Recent</h3>
            <Link to="/history" className="rpt-sheet-link">See all</Link>
          </div>
          <div className="rpt-recent">
            {recent.length === 0 ? (
              <p className="rpt-muted">No expenses this month yet.</p>
            ) : (
              recent.map((expense) => (
                <div key={expense.id} className="rpt-recent-row">
                  <div
                    className="rpt-recent-icon"
                    style={{ background: `${getCategoryColor(expense.category)}1f` }}
                  >
                    {(() => {
                      const Icon = (CAT_META[expense.category] || CAT_META.Other).icon;
                      return <Icon size={15} color={getCategoryColor(expense.category)} />;
                    })()}
                  </div>
                  <div className="rpt-recent-info">
                    <div className="rpt-recent-note">
                      {expense.note || expense.category}
                    </div>
                    <div className="rpt-recent-meta">
                      <span className={`badge ${getCategoryClass(expense.category)}`}>
                        {expense.category}
                      </span>
                      <span>{formatDateShort(expense.date)}</span>
                    </div>
                  </div>
                  <div className="rpt-recent-amt">−{formatCurrency(expense.amount)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* month comparison strip */}
        <section className="rpt-section rpt-section--last">
          <div className="rpt-compare">
            <div className="rpt-compare-col">
              <div className="rpt-compare-label">This month</div>
              <div className="rpt-compare-value">{formatCurrency(total)}</div>
            </div>
            <div className="rpt-compare-divider" />
            <div className="rpt-compare-col">
              <div className="rpt-compare-label">Last month</div>
              <div className="rpt-compare-value">{formatCurrency(lastMonth)}</div>
            </div>
            <div className="rpt-compare-divider" />
            <div className="rpt-compare-col">
              <div className="rpt-compare-label">Difference</div>
              <div className={`rpt-compare-value ${isUp ? 'neg' : 'pos'}`}>
                {isUp ? '+' : '−'}{formatCurrency(Math.abs(total - lastMonth))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reports;
