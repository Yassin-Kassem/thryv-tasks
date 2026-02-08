import { COLORS } from '../../utils/constants';
import { formatDate, getDayOfWeek } from '../../utils/dateHelpers';
import './ProductivityCard.css';

const ProductivityCard = ({ date, productive, breaksTime, timeAtWork, variant = 'green' }) => {
  const dayOfWeek = getDayOfWeek(date);
  const dateStr = formatDate(date);
  const day = date.getDate();

  const variantStyles = {
    green: {
      background: 'linear-gradient(135deg, #a7f3d0 0%, #86efac 100%)',
      shadow: '0 8px 24px rgba(134, 239, 172, 0.3)'
    },
    teal: {
      background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
      shadow: '0 8px 24px rgba(45, 212, 191, 0.3)'
    },
    dark: {
      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      shadow: '0 8px 24px rgba(13, 148, 136, 0.4)'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="productivity-card" style={{ background: style.background, boxShadow: style.shadow }}>
      <div className="productivity-card-header">
        <div className="date-badge">
          <div className="day-number">{day}</div>
          <div className="day-name">{dayOfWeek}</div>
        </div>
      </div>

      <div className="productivity-metrics">
        <div className="metric-row">
          <span className="metric-label">Productive</span>
          <span className="metric-badge productive">{productive}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Produktive Time</span>
          <span className="metric-value">{productive}</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Time at Work</span>
          <span className="metric-value">{timeAtWork}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductivityCard;
