import { Link } from 'react-router-dom';
import {
  IndianRupee,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
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
  formatDateShort
} from '../../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
  const { state } = useExpense();
  
  const todaysSpend = getTodaysSpend(state.expenses);
  const monthSpend = getMonthSpend(state.expenses);
  
  const peopleWithBalances = calculateBalances(state.people, state.expenses);
  const totalOwedToYou = peopleWithBalances.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
  const totalYouOwe = peopleWithBalances.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);

  const pieData = getTopCategories(state.expenses, 8);
  const areaData = getLast30DaysTrend(state.expenses);
  const recentActivity = state.expenses.slice(0, 5);

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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {state.user.name}</p>
      </div>

      <div className="dashboard-stats">
        <StatCard
          icon={IndianRupee}
          label="Today's Spend"
          value={formatCurrency(todaysSpend)}
          color="violet"
          delay={0}
        />
        <StatCard
          icon={Wallet}
          label="This Month's Spend"
          value={formatCurrency(monthSpend)}
          color="cyan"
          delay={100}
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Total You're Owed"
          value={formatCurrency(totalOwedToYou)}
          color="success"
          delay={200}
        />
        <StatCard
          icon={ArrowUpRight}
          label="Total You Owe"
          value={formatCurrency(totalYouOwe)}
          color="danger"
          delay={300}
        />
      </div>

      <div className="dashboard-charts">
        <div className="chart-card" style={{ animationDelay: '400ms' }}>
          <div className="chart-card-header">
            <h2 className="chart-card-title">Spending by Category</h2>
          </div>
          <div style={{ height: 260, position: 'relative' }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
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
              {pieData.slice(0, 4).map(entry => (
                <div key={entry.name} className="pie-legend-item">
                  <span className="pie-legend-dot" style={{ background: entry.color }}></span>
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
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="var(--accent-cyan)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-recent">
        <div className="dashboard-recent-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Activity</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/add" className="btn btn-primary btn-sm add-expense-btn">
              <Plus size={15} /> Add Expense
            </Link>
            <Link to="/history" className="btn btn-ghost btn-sm">View All</Link>
          </div>
        </div>
        
        <div className="recent-list">
          {recentActivity.length > 0 ? (
            recentActivity.map(expense => (
              <div key={expense.id} className="recent-item">
                <div className={`recent-item-icon ${getCategoryClass(expense.category)}`} style={{ background: 'transparent' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: 'currentColor', opacity: 0.15, position: 'absolute' }}></div>
                  <span style={{ position: 'relative', fontSize: '16px' }}>
                    {expense.category.charAt(0)}
                  </span>
                </div>
                <div className="recent-item-details">
                  <div className="recent-item-note">{expense.note || expense.category}</div>
                  <div className="recent-item-meta">
                    <span>{formatDateShort(expense.date)}</span>
                    <span>•</span>
                    <span className={`badge ${getCategoryClass(expense.category)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {expense.category}
                    </span>
                    {expense.isShared && (
                      <>
                        <span>•</span>
                        <span className="text-accent" style={{ fontSize: '10px' }}>Shared</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="recent-item-amount">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No recent activity. Start adding expenses!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
