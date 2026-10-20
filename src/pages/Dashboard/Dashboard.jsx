import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  PieChart as PieChartIcon,
  ChevronRight,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Coffee,
  Train,
  Home,
  BookOpen,
  Utensils,
  Package,
} from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpense } from '../../context/ExpenseContext';
import StatCard from '../../components/StatCard/StatCard';
import {
  formatCurrency,
  getTodaysSpend,
  getMonthSpend,
  getTopCategories,
  getLast30DaysTrend,
  calculateBalances,
  getCategoryClass,
  formatDateShort,
  getLastMonthSpend,
  isToday,
} from '../../utils/helpers';
import './Dashboard.css';

const CAT_ICONS = {
  Food: Utensils,
  Travel: Train,
  Groceries: ShoppingCart,
  'Rent/Bills': Home,
  Shopping: ShoppingBag,
  Entertainment: Coffee,
  Health: Heart,
  Education: BookOpen,
  Other: Package,
};

const formatBalanceParts = (amount) => {
  const n = Math.max(0, Number(amount) || 0);
  const [whole, frac = '00'] = n.toFixed(2).split('.');
  return {
    whole: new Intl.NumberFormat('en-IN').format(Number(whole)),
    frac,
  };
};

const formatTxnWhen = (dateStr) => {
  if (isToday(dateStr)) return 'Today';
  return formatDateShort(dateStr);
};

const DashboardTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="dash-chart-tooltip">
      <p className="dash-tooltip-date">
        {payload[0].payload.date || payload[0].name}
      </p>
      <p className="dash-tooltip-amt">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const { state } = useExpense();

  const todaysSpend = getTodaysSpend(state.expenses);
  const monthSpend = getMonthSpend(state.expenses);
  const lastMonthSpend = getLastMonthSpend(state.expenses);

  const peopleWithBalances = calculateBalances(state.people, state.expenses);
  const totalOwedToYou = peopleWithBalances.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalYouOwe = peopleWithBalances.filter((p) => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);

  const pieData = getTopCategories(state.expenses, 6);
  const areaData = getLast30DaysTrend(state.expenses);
  const recentActivity = [...state.expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const firstName = (state.user.name || 'User').split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  const pctNum = lastMonthSpend > 0
    ? (((monthSpend - lastMonthSpend) / lastMonthSpend) * 100)
    : 0;
  const pctChange = Math.abs(pctNum).toFixed(1);
  const spendUp = pctNum > 0;
  const balance = formatBalanceParts(monthSpend);

  return (
    <div className="dash-root">
      {/* ── TOP HERO SECTION ── */}
      <section className="dash-hero">
        <div className="dash-hero-top">
          <div className="dash-user-badge">
            <Link to="/profile" className="dash-avatar" aria-label="Profile">
              {initial}
            </Link>
            <div>
              <span className="dash-greeting-label">Welcome back,</span>
              <h1 className="dash-greeting-name">{state.user.name || 'User'}</h1>
            </div>
          </div>
          <div className="dash-hero-actions">
            <Link to="/reports" className="dash-top-btn" aria-label="Reports">
              <PieChartIcon size={18} />
            </Link>
            <Link to="/profile" className="dash-top-btn" aria-label="Settings">
              <Wallet size={18} />
            </Link>
          </div>
        </div>

        {/* Big Balance Callout */}
        <div className="dash-balance-block">
          <span className="dash-balance-tag">This Month's Spending</span>
          <div className="dash-balance-number">
            <span className="dash-currency-sym">₹</span>
            <span className="dash-amount-int">{balance.whole}</span>
            <span className="dash-amount-dec">.{balance.frac}</span>
          </div>
          <div className={`dash-trend-badge ${spendUp ? 'up' : 'down'}`}>
            {spendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{pctChange}% vs last month</span>
          </div>
        </div>

        {/* Quick Action Navigation Pills */}
        <div className="dash-action-pills">
          <Link to="/add" className="dash-action-btn primary">
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Expense</span>
          </Link>
          <Link to="/reports" className="dash-action-btn glass">
            <PieChartIcon size={16} />
            <span>Analytics</span>
          </Link>
          <Link to="/people" className="dash-action-btn glass">
            <Users size={16} />
            <span>Split Bill</span>
          </Link>
        </div>
      </section>

      {/* ── 4 STAT CARDS ── */}
      <section className="dash-stats-grid">
        <StatCard
          icon={IndianRupee}
          label="Today's Spend"
          value={formatCurrency(todaysSpend)}
          color="violet"
          delay={0}
        />
        <StatCard
          icon={Wallet}
          label="This Month"
          value={formatCurrency(monthSpend)}
          color="cyan"
          delay={80}
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Owed to You"
          value={formatCurrency(totalOwedToYou)}
          color="success"
          delay={160}
        />
        <StatCard
          icon={ArrowUpRight}
          label="You Owe"
          value={formatCurrency(totalYouOwe)}
          color="danger"
          delay={240}
        />
      </section>

      {/* ── LUMINOUS WHITE MAIN SHEET ── */}
      <section className="bank-sheet dash-main-sheet">
        {/* Analytics & Trend Grid */}
        <div className="dash-charts-grid">
          {/* Trend Chart Card */}
          <div className="dash-chart-box">
            <div className="dash-box-header">
              <div>
                <h2 className="dash-box-title">Spending Trend</h2>
                <p className="dash-box-sub">Last 30 days cash flow</p>
              </div>
              <span className="dash-pill-badge">
                <TrendingUp size={12} /> Active
              </span>
            </div>
            <div className="dash-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashTrendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Category Distribution */}
          <div className="dash-chart-box">
            <div className="dash-box-header">
              <div>
                <h2 className="dash-box-title">Top Categories</h2>
                <p className="dash-box-sub">This month's share</p>
              </div>
              <Link to="/reports" className="dash-link-more">
                Details <ChevronRight size={14} />
              </Link>
            </div>
            <div className="dash-donut-wrap">
              {pieData.length > 0 ? (
                <>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={72}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<DashboardTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="dash-cat-tags">
                    {pieData.slice(0, 4).map((cat) => (
                      <div key={cat.name} className="dash-cat-tag">
                        <span className="dash-cat-dot" style={{ background: cat.color }} />
                        <span className="dash-cat-name">{cat.name}</span>
                        <span className="dash-cat-val">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dash-empty-chart">
                  No category expenses logged yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="dash-recent-section">
          <div className="dash-box-header">
            <div>
              <h2 className="dash-box-title">Recent Transactions</h2>
              <p className="dash-box-sub">Latest account movements</p>
            </div>
            <Link to="/history" className="dash-link-more">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="dash-txn-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((expense) => {
                const CatIcon = CAT_ICONS[expense.category] || Package;
                return (
                  <div key={expense.id} className="dash-txn-item">
                    <div className={`dash-txn-icon ${getCategoryClass(expense.category)}`}>
                      <CatIcon size={18} />
                    </div>
                    <div className="dash-txn-info">
                      <div className="dash-txn-title">{expense.note || expense.category}</div>
                      <div className="dash-txn-meta">
                        <span>{formatTxnWhen(expense.date)}</span>
                        <span>•</span>
                        <span className="dash-txn-cat-badge">{expense.category}</span>
                        {expense.isShared && (
                          <>
                            <span>•</span>
                            <span className="dash-txn-shared-badge">Shared</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="dash-txn-amt">
                      -{formatCurrency(expense.amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dash-empty-txns">
                <p>No expenses recorded yet.</p>
                <Link to="/add" className="dash-action-btn primary" style={{ display: 'inline-flex', marginTop: 12 }}>
                  <Plus size={16} /> Add First Expense
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
