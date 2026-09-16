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
  getCategoryColor,
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

const Dashboard = () => {
  const { state } = useExpense();

  const todaysSpend = getTodaysSpend(state.expenses);
  const monthSpend = getMonthSpend(state.expenses);
  const lastMonthSpend = getLastMonthSpend(state.expenses);

  const peopleWithBalances = calculateBalances(state.people, state.expenses);
  const totalOwedToYou = peopleWithBalances.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalYouOwe = peopleWithBalances.filter((p) => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);

  const pieData = getTopCategories(state.expenses, 8);
  const areaData = getLast30DaysTrend(state.expenses);
  const recentActivity = [...state.expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const firstName = (state.user.name || 'User').split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  const pctNum = lastMonthSpend > 0
    ? (((monthSpend - lastMonthSpend) / lastMonthSpend) * 100)
    : 0;
  const pctChange = Math.abs(pctNum).toFixed(2);
  const spendUp = pctNum > 0;
  const balance = formatBalanceParts(monthSpend);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-static" style={{ padding: '8px 12px', fontSize: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {payload[0].payload.date || payload[0].name}
          </p>
          <p style={{ color: payload[0].payload.color || 'var(--accent-cyan)', fontWeight: 600 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container dash-page">

      {/* ══════════════════════════════
          DESKTOP
      ══════════════════════════════ */}
      <div className="page-header mobile-hide">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {state.user.name}</p>
      </div>

      <div className="dashboard-stats mobile-hide">
        <StatCard icon={IndianRupee} label="Today's Spend" value={formatCurrency(todaysSpend)} color="violet" delay={0} />
        <StatCard icon={Wallet} label="This Month" value={formatCurrency(monthSpend)} color="cyan" delay={100} />
        <StatCard icon={ArrowDownLeft} label="Owed to You" value={formatCurrency(totalOwedToYou)} color="success" delay={200} />
        <StatCard icon={ArrowUpRight} label="You Owe" value={formatCurrency(totalYouOwe)} color="danger" delay={300} />
      </div>

      <div className="dashboard-charts mobile-hide">
        <div className="chart-card" style={{ animationDelay: '400ms' }}>
          <div className="chart-card-header">
            <h2 className="chart-card-title">Spending by Category</h2>
          </div>
          <div style={{ height: 260, position: 'relative' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                No spending data this month
              </div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="pie-legend">
              {pieData.slice(0, 4).map((entry) => (
                <div key={entry.name} className="pie-legend-item">
                  <span className="pie-legend-dot" style={{ background: entry.color }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-card" style={{ animationDelay: '500ms' }}>
          <div className="chart-card-header">
            <h2 className="chart-card-title">Last 30 Days Trend</h2>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-recent mobile-hide">
        <div className="dashboard-recent-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Transactions</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/add" className="btn btn-primary btn-sm add-expense-btn"><Plus size={15} /> Add Expense</Link>
            <Link to="/history" className="btn btn-ghost btn-sm">View All</Link>
          </div>
        </div>
        <div className="recent-list">
          {recentActivity.length > 0 ? recentActivity.map((expense) => (
            <div key={expense.id} className="recent-item">
              <div className={`recent-item-icon ${getCategoryClass(expense.category)}`} style={{ background: 'transparent' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: 'currentColor', opacity: 0.15, position: 'absolute' }} />
                <span style={{ position: 'relative', fontSize: '16px' }}>{expense.category.charAt(0)}</span>
              </div>
              <div className="recent-item-details">
                <div className="recent-item-note">{expense.note || expense.category}</div>
                <div className="recent-item-meta">
                  <span>{formatDateShort(expense.date)}</span><span>•</span>
                  <span className={`badge ${getCategoryClass(expense.category)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{expense.category}</span>
                </div>
              </div>
              <div className="recent-item-amount">{formatCurrency(expense.amount)}</div>
            </div>
          )) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No recent activity.</div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          MOBILE — banking-style UI
      ══════════════════════════════ */}
      <div className="mob-hero desktop-hide">
        <div className="mob-topbar">
          <Link to="/profile" className="mob-avatar" aria-label="Profile">
            {initial}
          </Link>
          <Link to="/profile" className="mob-bell" aria-label="Settings">
            <Wallet size={18} strokeWidth={1.75} />
          </Link>
        </div>

        <div className="mob-balance-label">This month</div>
        <div className="mob-balance-amount">
          <span className="mob-balance-currency">₹</span>
          <span className="mob-balance-int">{balance.whole}</span>
          <span className="mob-balance-frac">.{balance.frac}</span>
        </div>

        <div className={`mob-balance-trend ${spendUp ? 'up' : 'down'}`}>
          {spendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {pctChange}% vs last month
        </div>
      </div>

      <div className="mob-sheet desktop-hide">
        <div className="mob-actions">
          <Link to="/add" className="mob-action-pill">
            <Plus size={18} strokeWidth={2.25} />
            Add Expense
          </Link>
          <Link to="/reports" className="mob-action-circle" aria-label="Reports">
            <PieChartIcon size={18} strokeWidth={2} />
          </Link>
          <Link to="/people" className="mob-action-pill">
            <Users size={18} strokeWidth={2} />
            People
          </Link>
        </div>

        <div className="mob-txn-header">
          <h2 className="mob-txn-title">Recent Transactions</h2>
          <Link to="/history" className="mob-txn-link">View All</Link>
        </div>

        <div className="mob-txn-list">
          {recentActivity.length > 0 ? recentActivity.map((expense) => {
            const Icon = CAT_ICONS[expense.category] || Package;
            const color = getCategoryColor(expense.category);
            return (
              <div key={expense.id} className="mob-txn-item">
                <div className="mob-txn-icon" style={{ color }}>
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <div className="mob-txn-details">
                  <div className="mob-txn-name">{expense.note || expense.category}</div>
                  <div className="mob-txn-date">
                    {formatTxnWhen(expense.date)}
                    {expense.paymentMethod ? `, ${expense.paymentMethod}` : ''}
                  </div>
                </div>
                <div className="mob-txn-amount">−{formatCurrency(expense.amount)}</div>
              </div>
            );
          }) : (
            <div className="mob-txn-empty">
              No recent activity. <Link to="/add">Add one →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
