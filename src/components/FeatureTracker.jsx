import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const EMPTY = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" opacity="0.35"/>
  </svg>
);
const PLUS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const TRASH = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const COMMENT_ICON = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H4l-2 2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Team members
const TEAM_MEMBERS = ["yassin", "youssef", "madany", "malek"];

// Priority configuration with colors
const PRIORITY_CONFIG = {
  high: { label: "High", color: "#ef4444", bgColor: "#7f1d1d" },
  medium: { label: "Medium", color: "#f59e0b", bgColor: "#78350f" },
  low: { label: "Low", color: "#6b7280", bgColor: "#374151" },
};

export default function FeatureTracker() {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  // New state for team assignment
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // New state for priority
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // New state for comments
  const [comments, setComments] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newComment, setNewComment] = useState("");

  // Fetch categories, tasks, and comments on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const [catResult, taskResult, commentResult] = await Promise.all([
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("comments").select("*").order("created_at", { ascending: false }),
      ]);

      if (catResult.error) {
        setError(catResult.error.message);
        setLoading(false);
        return;
      }
      if (taskResult.error) {
        setError(taskResult.error.message);
        setLoading(false);
        return;
      }
      if (commentResult.error) {
        setError(commentResult.error.message);
        setLoading(false);
        return;
      }

      setCategories(catResult.data);
      setTasks(taskResult.data);
      setComments(commentResult.data);
      if (catResult.data.length > 0) {
        setNewTaskCategory(catResult.data[0].id);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  // Real-time subscription for tasks
  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              setTasks((prev) => {
                if (prev.some((t) => t.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
              break;
            case "UPDATE":
              setTasks((prev) =>
                prev.map((t) => (t.id === payload.new.id ? payload.new : t))
              );
              break;
            case "DELETE":
              setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Real-time subscription for comments
  useEffect(() => {
    const channel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              setComments((prev) => {
                if (prev.some((c) => c.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
              break;
            case "UPDATE":
              setComments((prev) =>
                prev.map((c) => (c.id === payload.new.id ? payload.new : c))
              );
              break;
            case "DELETE":
              setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derive nested data structure from flat arrays with priority sorting
  const data = useMemo(() => {
    const result = {};
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    for (const cat of categories) {
      const categoryTasks = tasks
        .filter((t) => t.category_id === cat.id)
        .sort((a, b) => {
          // Sort by priority first, then by creation date
          const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.created_at) - new Date(b.created_at);
        });

      result[cat.id] = {
        name: cat.name,
        color: cat.color,
        features: categoryTasks.map((t) => ({
          id: t.id,
          name: t.name,
          done: t.done,
          assigned_to: t.assigned_to,
          priority: t.priority || 'medium',
        })),
      };
    }
    return result;
  }, [categories, tasks]);

  const toggle = async (catId, taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newDone = !task.done;
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ done: newDone })
      .eq("id", taskId);

    if (error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: task.done } : t))
      );
    }
  };

  const addTask = async () => {
    if (!newTaskName.trim()) return;

    const id = `${newTaskCategory[0]}${Date.now()}`;
    const newTask = {
      id,
      category_id: newTaskCategory,
      name: newTaskName.trim(),
      done: false,
      assigned_to: newTaskAssignee || null,
      priority: newTaskPriority,
    };

    // Optimistic update
    setTasks((prev) => [...prev, newTask]);
    setNewTaskName("");
    setNewTaskAssignee("");
    setNewTaskPriority("medium");
    setShowAddTask(false);

    const { error } = await supabase.from("tasks").insert(newTask);

    if (error) {
      // Revert on failure
      setTasks((prev) => prev.filter((t) => t.id !== id));
      console.error("Failed to add task:", error);
    }
  };

  const deleteTask = async (catId, taskId) => {
    if (!confirm("Delete this task?")) return;

    const task = tasks.find((t) => t.id === taskId);
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      // Revert on failure
      if (task) setTasks((prev) => [...prev, task]);
    }
  };

  const addComment = async (taskId) => {
    const [author, content] = newComment.split("::");

    if (!author || !content?.trim()) {
      alert("Please enter your name and a comment");
      return;
    }

    const id = `c${taskId}_${Date.now()}`;
    const newCommentObj = {
      id,
      task_id: taskId,
      author: author,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setComments((prev) => [newCommentObj, ...prev]);
    setNewComment("");

    const { error } = await supabase.from("comments").insert(newCommentObj);

    if (error) {
      // Revert on failure
      setComments((prev) => prev.filter((c) => c.id !== id));
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const stats = useMemo(() => {
    let total = 0,
      done = 0;
    const catStats = {};
    Object.entries(data).forEach(([catId, { features }]) => {
      const catDone = features.filter((f) => f.done).length;
      catStats[catId] = {
        done: catDone,
        total: features.length,
        pct: features.length > 0 ? Math.round((catDone / features.length) * 100) : 0,
      };
      total += features.length;
      done += catDone;
    });
    return {
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      catStats,
    };
  }, [data]);

  // Helper functions for comments
  const getCommentCount = (taskId) => {
    return comments.filter((c) => c.task_id === taskId).length;
  };

  const getTaskComments = (taskId) => {
    return comments.filter((c) => c.task_id === taskId);
  };

  // Multi-dimensional filtering
  const filteredFeatures = (features) => {
    let filtered = features;

    // Filter by done status
    if (filter === "done") filtered = filtered.filter((f) => f.done);
    if (filter === "pending") filtered = filtered.filter((f) => !f.done);

    // Filter by assignee
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((f) => f.assigned_to === assigneeFilter);
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter((f) => f.priority === priorityFilter);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6b7280", fontSize: 14 }}>Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#f87171", fontSize: 14, fontWeight: 600 }}>Failed to load tasks</div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 8, background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6b7280", fontSize: 14 }}>No categories found. Database may be empty.</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e2e4e9", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "32px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>
            🏋️ Fitness App — Team Task Manager
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "6px 0 0", fontWeight: 400 }}>
            Collaborative · Live updates · Shared across team
          </p>
        </div>

        {/* Overall progress bar */}
        <div style={{ background: "#1a1d27", borderRadius: 12, padding: "18px 20px", marginBottom: 24, border: "1px solid #2a2d3a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Overall Progress</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: stats.pct >= 70 ? "#4ade80" : stats.pct >= 40 ? "#fb923c" : "#f472b6" }}>
              {stats.pct}<span style={{ fontSize: 13, fontWeight: 400, color: "#6b7280" }}> %</span>
            </span>
          </div>
          <div style={{ background: "#2a2d3a", borderRadius: 6, height: 10, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${stats.pct}%`,
              borderRadius: 6,
              background: "linear-gradient(90deg, #4ade80, #60a5fa)",
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{stats.done} of {stats.total} tasks completed</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{stats.total - stats.done} remaining</span>
          </div>
        </div>

        {/* Filter pills + Add Task button */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {/* Status filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", "done", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? (f === "done" ? "#166534" : f === "pending" ? "#7c2d12" : "#1e3a5f") : "transparent",
                  color: filter === f ? "#fff" : "#6b7280",
                  border: filter === f ? "none" : "1px solid #2a2d3a",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {f === "all" ? `All (${stats.total})` : f === "done" ? `Done (${stats.done})` : `Pending (${stats.total - stats.done})`}
              </button>
            ))}
          </div>

          {/* Assignee filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
            <button
              onClick={() => setAssigneeFilter("all")}
              style={{
                background: assigneeFilter === "all" ? "#1e3a5f" : "transparent",
                color: assigneeFilter === "all" ? "#fff" : "#6b7280",
                border: assigneeFilter === "all" ? "none" : "1px solid #2a2d3a",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              All Team
            </button>
            {TEAM_MEMBERS.map((member) => (
              <button
                key={member}
                onClick={() => setAssigneeFilter(member)}
                style={{
                  background: assigneeFilter === member ? "#7c2d12" : "transparent",
                  color: assigneeFilter === member ? "#fff" : "#6b7280",
                  border: assigneeFilter === member ? "none" : "1px solid #2a2d3a",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {member}
              </button>
            ))}
          </div>

          {/* Priority filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
            <button
              onClick={() => setPriorityFilter("all")}
              style={{
                background: priorityFilter === "all" ? "#1e3a5f" : "transparent",
                color: priorityFilter === "all" ? "#fff" : "#6b7280",
                border: priorityFilter === "all" ? "none" : "1px solid #2a2d3a",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              All Priority
            </button>
            {Object.entries(PRIORITY_CONFIG).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setPriorityFilter(key)}
                style={{
                  background: priorityFilter === key ? color + "40" : "transparent",
                  color: priorityFilter === key ? color : "#6b7280",
                  border: priorityFilter === key ? `1px solid ${color}` : "1px solid #2a2d3a",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Add Task button */}
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            style={{
              background: "#4ade80",
              color: "#000",
              border: "none",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
              marginLeft: "auto",
            }}
          >
            {PLUS} Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div style={{ background: "#1a1d27", borderRadius: 10, padding: "16px", marginBottom: 20, border: "1px solid #2a2d3a" }}>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task name..."
              style={{
                width: "100%",
                background: "#0f1117",
                border: "1px solid #2a2d3a",
                borderRadius: 6,
                padding: "10px 12px",
                color: "#e2e4e9",
                fontSize: 13,
                marginBottom: 12,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              {/* Category dropdown */}
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                style={{
                  background: "#0f1117",
                  border: "1px solid #2a2d3a",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#e2e4e9",
                  fontSize: 13,
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Assignee dropdown */}
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                style={{
                  background: "#0f1117",
                  border: "1px solid #2a2d3a",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#e2e4e9",
                  fontSize: 13,
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map((member) => (
                  <option key={member} value={member} style={{ textTransform: "capitalize" }}>
                    {member}
                  </option>
                ))}
              </select>

              {/* Priority dropdown */}
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                style={{
                  background: "#0f1117",
                  border: "1px solid #2a2d3a",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#e2e4e9",
                  fontSize: 13,
                  flex: 1,
                  cursor: "pointer",
                }}
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={addTask}
                style={{
                  background: "#4ade80",
                  color: "#000",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                style={{
                  background: "transparent",
                  color: "#6b7280",
                  border: "1px solid #2a2d3a",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category sections */}
        {Object.entries(data).map(([catId, { name, color, features }]) => {
          const cs = stats.catStats[catId];
          const visible = filteredFeatures(features);
          if (visible.length === 0) return null;
          return (
            <div key={catId} style={{ marginBottom: 20 }}>
              {/* Category header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}55` }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{name}</span>
                </div>
                <span style={{ fontSize: 12, color: color, fontWeight: 600 }}>
                  {cs.done}/{cs.total} · {cs.pct}%
                </span>
              </div>

              {/* Mini progress */}
              <div style={{ background: "#2a2d3a", borderRadius: 3, height: 3, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${cs.pct}%`, background: color, borderRadius: 3, transition: "width 0.3s ease" }} />
              </div>

              {/* Feature list */}
              <div style={{ background: "#1a1d27", borderRadius: 10, border: "1px solid #2a2d3a", overflow: "hidden" }}>
                {visible.map((f, i) => {
                  const priority = PRIORITY_CONFIG[f.priority];
                  const commentCount = getCommentCount(f.id);
                  const isExpanded = expandedTaskId === f.id;

                  return (
                    <div key={f.id}>
                      {/* Main task row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          borderBottom: !isExpanded && i < visible.length - 1 ? "1px solid #2a2d3a" : "none",
                          background: f.done ? "#1a1d2780" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Checkbox */}
                        <span
                          onClick={() => toggle(catId, f.id)}
                          style={{ color: f.done ? color : "#4b5563", flexShrink: 0, display: "flex", alignItems: "center", cursor: "pointer" }}
                        >
                          {f.done ? CHECK : EMPTY}
                        </span>

                        {/* Priority badge */}
                        <div
                          style={{
                            background: priority.bgColor,
                            color: priority.color,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            flexShrink: 0,
                          }}
                        >
                          {priority.label[0]}
                        </div>

                        {/* Task name */}
                        <span
                          onClick={() => toggle(catId, f.id)}
                          style={{
                            fontSize: 13,
                            color: f.done ? "#9ca3af" : "#d1d5db",
                            textDecoration: f.done ? "line-through" : "none",
                            textDecorationColor: f.done ? color + "60" : "transparent",
                            transition: "color 0.15s",
                            lineHeight: 1.4,
                            flex: 1,
                            cursor: "pointer",
                          }}
                        >
                          {f.name}
                        </span>

                        {/* Assignee badge */}
                        {f.assigned_to && (
                          <div
                            style={{
                              background: "#374151",
                              color: "#9ca3af",
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 12,
                              textTransform: "capitalize",
                              flexShrink: 0,
                            }}
                          >
                            {f.assigned_to}
                          </div>
                        )}

                        {/* Comment button */}
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : f.id)}
                          style={{
                            background: isExpanded ? "#1e3a5f" : "transparent",
                            border: "none",
                            color: commentCount > 0 ? "#60a5fa" : "#6b7280",
                            cursor: "pointer",
                            padding: "4px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                        >
                          {COMMENT_ICON}
                          {commentCount > 0 && commentCount}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteTask(catId, f.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#6b7280",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            opacity: 0.5,
                            transition: "opacity 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
                        >
                          {TRASH}
                        </button>
                      </div>

                      {/* Expanded comment section */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "16px 14px",
                            background: "#0f1117",
                            borderBottom: i < visible.length - 1 ? "1px solid #2a2d3a" : "none",
                          }}
                        >
                          {/* Comment list */}
                          <div style={{ marginBottom: 12, maxHeight: 300, overflowY: "auto" }}>
                            {getTaskComments(f.id).length === 0 ? (
                              <div
                                style={{
                                  color: "#6b7280",
                                  fontSize: 12,
                                  textAlign: "center",
                                  padding: "12px 0",
                                }}
                              >
                                No comments yet. Start the discussion!
                              </div>
                            ) : (
                              getTaskComments(f.id).map((comment) => (
                                <div
                                  key={comment.id}
                                  style={{
                                    background: "#1a1d27",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    marginBottom: 8,
                                    border: "1px solid #2a2d3a",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: 6,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#60a5fa",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {comment.author}
                                    </span>
                                    <span style={{ fontSize: 10, color: "#6b7280" }}>
                                      {new Date(comment.created_at).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#d1d5db",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {comment.content}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add comment form */}
                          <div style={{ display: "flex", gap: 8 }}>
                            <select
                              value={newComment.split("::")[0] || ""}
                              onChange={(e) => {
                                const author = e.target.value;
                                const content = newComment.split("::")[1] || "";
                                setNewComment(`${author}::${content}`);
                              }}
                              style={{
                                background: "#1a1d27",
                                border: "1px solid #2a2d3a",
                                borderRadius: 6,
                                padding: "8px 10px",
                                color: "#e2e4e9",
                                fontSize: 12,
                                width: 120,
                              }}
                            >
                              <option value="">Your name</option>
                              {TEAM_MEMBERS.map((member) => (
                                <option
                                  key={member}
                                  value={member}
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {member}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={newComment.split("::")[1] || ""}
                              onChange={(e) => {
                                const author = newComment.split("::")[0] || "";
                                setNewComment(`${author}::${e.target.value}`);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && addComment(f.id)}
                              placeholder="Add a comment..."
                              style={{
                                flex: 1,
                                background: "#1a1d27",
                                border: "1px solid #2a2d3a",
                                borderRadius: 6,
                                padding: "8px 12px",
                                color: "#e2e4e9",
                                fontSize: 12,
                                outline: "none",
                              }}
                            />
                            <button
                              onClick={() => addComment(f.id)}
                              style={{
                                background: "#4ade80",
                                color: "#000",
                                border: "none",
                                borderRadius: 6,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer note */}
        <div style={{ marginTop: 28, padding: "14px 18px", background: "#1a1d27", borderRadius: 10, border: "1px solid #2a2d3a" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>✓ Live sync enabled</span> — Changes are shared instantly with your entire team. Everyone sees updates in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
