import './ActivityTimeline.css';

const ActivityTimeline = ({ title, activities = [] }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00'];

  return (
    <div className="activity-timeline">
      <h3 className="activity-title">{title}</h3>

      <div className="timeline-container">
        {/* Time labels */}
        <div className="time-labels">
          {hours.map((hour) => (
            <span key={hour} className="time-label">{hour}</span>
          ))}
        </div>

        {/* Activity rows */}
        <div className="activity-rows">
          {days.map((day) => (
            <div key={day} className="activity-row">
              <span className="day-label">{day}</span>
              <div className="activity-track">
                {/* Render activities for this day */}
                {activities
                  .filter((a) => a.day === day)
                  .map((activity, idx) => (
                    <div
                      key={idx}
                      className="activity-block"
                      style={{
                        left: `${activity.startPercent}%`,
                        width: `${activity.widthPercent}%`,
                        background: activity.color
                      }}
                    >
                      <span className="activity-name">{activity.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sport marker at bottom */}
        <div className="sport-marker">
          <span className="sport-dot"></span>
          <span className="sport-label">Sport</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
