import { CalendarIcon, ClockIcon, NoteIcon } from '../common/Icons';
import './UpcomingSchedule.css';

const ScheduleItem = ({ icon, title, subtitle, time, type = 'default' }) => {
  const iconComponents = {
    calendar: <CalendarIcon />,
    clock: <ClockIcon />,
    note: <NoteIcon />
  };

  return (
    <div className="schedule-item">
      <div className={`schedule-icon ${type}`}>
        {iconComponents[icon] || <CalendarIcon />}
      </div>
      <div className="schedule-info">
        <h4 className="schedule-title">{title}</h4>
        <p className="schedule-subtitle">{subtitle}</p>
      </div>
      <span className="schedule-time">{time}</span>
    </div>
  );
};

const UpcomingSchedule = ({ title, items = [] }) => {
  return (
    <div className="upcoming-schedule">
      <div className="schedule-header">
        <h3 className="schedule-main-title">{title}</h3>
        <button className="see-all-btn">See All Activity</button>
      </div>

      <div className="schedule-list">
        {items.map((item, index) => (
          <ScheduleItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingSchedule;
