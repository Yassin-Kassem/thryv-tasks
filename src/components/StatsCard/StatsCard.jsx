import './StatsCard.css';

const CircularProgress = ({ percentage, size = 100, strokeWidth = 8, color = '#4ade80' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="progress-text">
        <div className="progress-icon">🌲</div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, stats = [] }) => {
  return (
    <div className="stats-card">
      <h3 className="stats-card-title">{title}</h3>

      <div className="stats-content">
        <div className="main-stat">
          <CircularProgress percentage={88} size={120} strokeWidth={10} color="#4ade80" />
        </div>

        <div className="stat-list">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${stat.percentage}%`,
                    background: stat.color || '#4ade80'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
