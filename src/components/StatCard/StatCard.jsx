import './StatCard.css';

const StatCard = ({ icon: Icon, label, value, trend, trendLabel, color = 'violet', delay = 0 }) => {
  return (
    <div
      className={`stat-card stat-card-${color}`}
      style={{ animationDelay: `${delay}ms` }}
      data-color={color}
    >
      <div className="stat-card-header">
        <div className={`stat-card-icon stat-card-icon-${color}`}>
          {Icon && <Icon size={20} />}
        </div>
        {trend !== undefined && (
          <span className={`stat-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trendLabel && <div className="stat-card-trend-label">{trendLabel}</div>}
    </div>
  );
};

export default StatCard;
