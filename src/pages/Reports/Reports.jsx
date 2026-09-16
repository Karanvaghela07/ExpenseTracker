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
  Food:          { icon: Utensils,     color: '#f97316' },
  Travel:        { icon: Train,        color: '#3b82f6' },
  Groceries:     { icon: ShoppingCart, color: '#10b981' },
  'Rent/Bills':  { icon: Home,         color: '#8b5cf6' },
  Shopping:      { icon: ShoppingBag,  color: '#ec4899' },
  Entertainment: { icon: Coffee,       color: '#f59e0b' },
  Health:        { icon: Heart,        color: '#ef4444' },
  Education:     { icon: BookOpen,     color: '#06b6d4' },
  Other:         { icon: Package,      color: '#64748b' },
  Sport:         { icon: Dumbbell,     color: '#22c55e' },
};

/* Absolute bubble layout — mirrors the reference composition */
const BUBBLE_LAYOUT = [
  { size: 132, top: '4%',  left: '6%'  },
  { size: 96,  top: '2%',  left: '58%' },
  { size: 118, top: '32%', left: '2%'  },
  { size: 168, top: '22%', left: '42%' },
  { size: 124, top: '58%', left: '10%' },
  { size: 90,  top: '62%', left: '62%' },
];

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

  const Circumference = 2 * Math.PI * 46;

  return (
    <div className="rpt-root bank-page">
      {/* ── blue hero with bubbles ── */}
      <div className="rpt-hero">
        <div className="rpt-topbar">
          <button type="button" className="rpt-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            className="rpt-icon-btn"
            onClick={() => setShowMonth((v) => !v)}
            aria-label="Period"
          >
            <Calendar size={18} />
          </button>
        </div>

        {showMonth && (
          <div className="rpt-period">{monthLabel()}</div>
        )}

        <div className="rpt-bubbles">
          {allCats.length === 0 ? (
            <div className="rpt-empty">No spending data this month</div>
          ) : (
            allCats.map((cat, i) => {
              const meta = CAT_META[cat.name] || CAT_META.Other;
              const Icon = meta.icon;
              const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0.0';
              const layout = BUBBLE_LAYOUT[i] || BUBBLE_LAYOUT[BUBBLE_LAYOUT.length - 1];
              const size = layout.size;
              const dash = total > 0 ? (cat.value / total) * Circumference : 0;

              return (
                <div
                  key={cat.name}
                  className="rpt-bubble"
                  style={{
                    width: size,
                    height: size,
                    top: layout.top,
                    left: layout.left,
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <svg className="rpt-bubble-arc" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="46" fill="none"
                      stroke="rgba(255,255,255,0.16)" strokeWidth="3.5"
                    />
                    <circle
                      cx="50" cy="50" r="46" fill="none"
                      stroke="rgba(255,255,255,0.85)" strokeWidth="3.5"
                      strokeDasharray={`${dash} ${Circumference}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="rpt-bubble-inner">
                    <Icon size={size > 140 ? 28 : size > 110 ? 22 : 18} color="#fff" strokeWidth={1.5} />
                    <span className="rpt-bubble-name">{cat.name}</span>
                    <span className="rpt-bubble-pct">{pct}%</span>
                  </div>
                </div>
              );
            })
          )}
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
