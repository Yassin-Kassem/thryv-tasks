import { useState, useEffect } from 'react';

/**
 * Custom hook for managing productivity data
 * This can be connected to Supabase or any other backend
 */
export const useProductivityData = () => {
  const [data, setData] = useState({
    dailyProductivity: [],
    stats: [],
    activities: [],
    schedule: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    // In a real app, this would fetch from Supabase
    setTimeout(() => {
      setData({
        dailyProductivity: [
          {
            date: new Date(2024, 6, 18), // July 18
            productive: '8h',
            breaksTime: '72m',
            timeAtWork: '7h 10m',
            variant: 'green'
          },
          {
            date: new Date(2024, 6, 19), // July 19
            productive: '6h',
            breaksTime: '4h 74m',
            timeAtWork: '6h 30m',
            variant: 'teal'
          },
          {
            date: new Date(2024, 6, 20), // July 20
            productive: '7h',
            breaksTime: '3h 05m',
            timeAtWork: '7h 10m',
            variant: 'dark'
          }
        ],
        stats: [
          { label: 'Today', value: '88%', percentage: 88, color: '#4ade80' },
          { label: 'Weekly', value: '85%', percentage: 85, color: '#22d3ee' },
          { label: 'Month', value: '73%', percentage: 73, color: '#fb923c' }
        ],
        activities: [
          { day: 'Tue', name: 'Makeup at Gym', startPercent: 20, widthPercent: 30, color: '#86efac' },
          { day: 'Wed', name: 'Website Redesign', startPercent: 45, widthPercent: 35, color: '#5eead4' }
        ],
        schedule: [
          {
            icon: 'calendar',
            title: 'Desk Time Redesign',
            subtitle: 'Monday Call',
            time: '09:30 AM',
            type: 'default'
          },
          {
            icon: 'calendar',
            title: 'New Landing Page',
            subtitle: 'Working On',
            time: '10:00 AM',
            type: 'success'
          },
          {
            icon: 'note',
            title: 'Create Animation for App',
            subtitle: 'Working On',
            time: '10:30 AM',
            type: 'warning'
          }
        ]
      });
      setLoading(false);
    }, 500);
  }, []);

  return { data, loading };
};
