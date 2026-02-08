import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for fetching and managing Supabase data
 * Can be used alongside the new UI components
 */
export const useSupabaseData = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksResult, categoriesResult] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at'),
        supabase.from('categories').select('*').order('created_at')
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setTasks(tasksResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        handleTaskChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTaskChange = (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        setTasks((prev) => [...prev, payload.new]);
        break;
      case 'UPDATE':
        setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
        break;
      case 'DELETE':
        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        break;
    }
  };

  const addTask = async (task) => {
    const { error } = await supabase.from('tasks').insert(task);
    if (error) throw error;
  };

  const updateTask = async (id, updates) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) throw error;
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  };

  return {
    tasks,
    categories,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask
  };
};
