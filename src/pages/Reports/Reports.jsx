import { Download, TrendingUp, Zap, Calendar, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useExpense } from '../../context/ExpenseContext';
import { useToast } from '../../components/Toast/Toast';
import StatCard from '../../components/StatCard/StatCard';
import { 
  formatCurrency,
  getMonthlyComparison,
  getTopCategories,
  getHighestExpense,
  getAverageDailySpend,
  getSpendingPrediction,
  exportToCSV,
  getCategoryClass,
  formatDateShort
} from '../../utils/helpers';
import './Reports.css';

const Reports = () => {
  const { state } = useExpense();
  const { addToast } = useToast();

  const monthlyComparison = getMonthlyComparison(state.expenses);
  const topCategories = getTopCategories(state.expenses, 5);
  const highestExpense = getHighestExpense(state.expenses);
  const averageDaily = getAverageDailySpend(state.expenses);
  const prediction = getSpendingPrediction(state.expenses);

  const totalThisMonth = monthlyComparison.reduce((sum, item) => sum + item.thisMonth, 0);

  const handleExport = () => {
    if (state.expenses.length === 0) {
      addToast('No data to export', 'error');
      return;
    }
    exportToCSV(state.expenses);
    addToast('Report exported successfully', 'success');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-static" style={{ padding: '12px', minWidth: '150px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
            {payload[0].payload.category}
          </p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Deep dive into your spending habits</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatCard
          icon={Calendar}
          label="Average Daily Spend"
          value={formatCurrency(averageDaily)}
          color="info"
          delay={0}
        />
        <StatCard
          icon={CreditCard}
          label="Transactions (Month)"
          value={state.expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length}
          color="violet"
          delay={100}
        />
      </div>

      <div className="reports-grid">
        <div className="report-section" style={{ animationDelay: '200ms' }}>
          <div className="report-section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>This Month vs Last Month</h2>
          </div>
          
          <div style={{ height: 350 }}>
            {monthlyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="lastMonth" name="Last Month" fill="var(--bg-surface-hover)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="thisMonth" name="This Month" fill="var(--accent-violet)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                Not enough data for comparison
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div className="report-section" style={{ animationDelay: '300ms' }}>
            <h2 className="section-title">Top Categories</h2>
            <div className="top-categories-list">
              {topCategories.length > 0 ? topCategories.map((cat, idx) => (
                <div key={cat.name} className="top-category-item">
                  <div className="top-category-info">
                    <div className="top-category-name">
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>#{idx + 1}</span>
                      <span className={`badge ${getCategoryClass(cat.name)}`} style={{ padding: '2px 8px' }}>{cat.name}</span>
                    </div>
                    <div className="top-category-amount">{formatCurrency(cat.value)}</div>
                  </div>
                  <div className="progress-bar" style={{ height: 6, background: 'var(--bg-secondary)' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${(cat.value / totalThisMonth) * 100}%`,
                        background: cat.color
                      }} 
                    />
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-md) 0' }}>
                  No spending this month
                </div>
              )}
            </div>
          </div>

          <div className="report-section" style={{ animationDelay: '400ms', padding: 0, background: 'transparent', border: 'none' }}>
            {highestExpense && (
              <div className="highlight-card">
                <div className="highlight-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="highlight-details">
                  <div className="highlight-label">Highest Single Expense</div>
                  <div className="highlight-value">{formatCurrency(highestExpense.amount)}</div>
                  <div className="highlight-meta">
                    {highestExpense.note || highestExpense.category} on {formatDateShort(highestExpense.date)}
                  </div>
                </div>
              </div>
            )}

            <div className="prediction-card">
              <Zap size={24} className="prediction-icon" />
              <div className="prediction-text">
                Based on your average daily spend, you're likely to spend
                <span className="prediction-amount">{formatCurrency(prediction)}</span>
                by the end of this month.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
