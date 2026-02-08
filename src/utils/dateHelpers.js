/**
 * Format date to display format (e.g., "Jul 18")
 */
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get day of week (e.g., "Mon", "Tue")
 */
export const getDayOfWeek = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Format time duration (e.g., "8h" or "30m")
 */
export const formatDuration = (hours, minutes = 0) => {
  if (hours >= 1) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get date range for current week
 */
export const getCurrentWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - currentDay);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + i);
    dates.push(date);
  }

  return dates;
};

/**
 * Get time in 12-hour format (e.g., "09:30 AM")
 */
export const formatTime = (hours, minutes) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};
