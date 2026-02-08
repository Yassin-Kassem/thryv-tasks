import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import "./TaskTracker.css";

// SVG Icons
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

const TEAM_MEMBERS = ["yassin", "youssef", "madany", "malek"];

const PRIORITY_CONFIG = {
  high: { label: "High", color: "#ef4444", bgColor: "#fee2e2" },
  medium: { label: "Medium", color: "#f59e0b", bgColor: "#fef3c7" },
  low: { label: "Low", color: "#6b7280", bgColor: "#f3f4f6" },
};

export default function TaskTracker() {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [comments, setComments] = useState([]);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newComment, setNewComment] = useState("");

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

  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        switch (payload.eventType) {
          case "INSERT":
            setTasks((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            break;
          case "UPDATE":
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
            break;
          case "DELETE":
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("comments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, (payload) => {
        switch (payload.eventType) {
          case "INSERT":
            setComments((prev) => {
              if (prev.some((c) => c.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
            break;
          case "UPDATE":
            setComments((prev) => prev.map((c) => (c.id === payload.new.id ? payload.new : c)));
            break;
          case "DELETE":
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const data = useMemo(() => {
    const result = {};
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    for (const cat of categories) {
      const categoryTasks = tasks
        .filter((t) => t.category_id === cat.id)
        .sort((a, b) => {
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
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)));

    const { error } = await supabase.from("tasks").update({ done: newDone }).eq("id", taskId);

    if (error) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: task.done } : t)));
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

    setTasks((prev) => [...prev, newTask]);
    setNewTaskName("");
    setNewTaskAssignee("");
    setNewTaskPriority("medium");
    setShowAddTask(false);

    const { error } = await supabase.from("tasks").insert(newTask);

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      console.error("Failed to add task:", error);
    }
  };

  const deleteTask = async (catId, taskId) => {
    if (!confirm("Delete this task?")) return;

    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
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

    setComments((prev) => [newCommentObj, ...prev]);
    setNewComment("");

    const { error } = await supabase.from("comments").insert(newCommentObj);

    if (error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const stats = useMemo(() => {
    let total = 0, done = 0;
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

  const getCommentCount = (taskId) => {
    return comments.filter((c) => c.task_id === taskId).length;
  };

  const getTaskComments = (taskId) => {
    return comments.filter((c) => c.task_id === taskId);
  };

  const filteredFeatures = (features) => {
    let filtered = features;

    if (filter === "done") filtered = filtered.filter((f) => f.done);
    if (filter === "pending") filtered = filtered.filter((f) => !f.done);
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((f) => f.assigned_to === assigneeFilter);
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter((f) => f.priority === priorityFilter);
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-content">
          <div className="error-title">Failed to load tasks</div>
          <div className="error-message">{error}</div>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="empty-state">
        <p>No categories found. Database may be empty.</p>
      </div>
    );
  }

  return (
    <div className="task-tracker">
      <div className="task-container">
        {/* Header */}
        <header className="task-header">
          <div className="header-content">
            <h1 className="app-title">Thryv — Team Task Manager</h1>
            <p className="app-subtitle">Collaborative · Live updates · Shared across team</p>
          </div>
        </header>

        {/* Progress Card */}
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">Overall Progress</span>
            <span className="progress-percentage" style={{ color: stats.pct >= 70 ? '#10b981' : stats.pct >= 40 ? '#f59e0b' : '#ec4899' }}>
              {stats.pct}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <div className="progress-stats">
            <span>{stats.done} of {stats.total} tasks completed</span>
            <span>{stats.total - stats.done} remaining</span>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="filter-section">
          <div className="filter-group">
            <span className="filter-group-label">Status:</span>
            {["all", "done", "pending"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
              >
                {f === "all" ? `All (${stats.total})` : f === "done" ? `Done (${stats.done})` : `Pending (${stats.total - stats.done})`}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Team:</span>
            <button
              onClick={() => setAssigneeFilter("all")}
              className={`filter-btn ${assigneeFilter === "all" ? 'active' : ''}`}
            >
              All Team
            </button>
            {TEAM_MEMBERS.map((member) => (
              <button
                key={member}
                onClick={() => setAssigneeFilter(member)}
                className={`filter-btn ${assigneeFilter === member ? 'active' : ''}`}
              >
                {member}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Priority:</span>
            <button
              onClick={() => setPriorityFilter("all")}
              className={`filter-btn ${priorityFilter === "all" ? 'active' : ''}`}
            >
              All Priority
            </button>
            {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setPriorityFilter(key)}
                className={`filter-btn ${priorityFilter === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAddTask(!showAddTask)} className="add-task-btn">
            {PLUS} Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="add-task-form">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task name..."
              className="task-input"
            />
            <div className="form-row">
              <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} className="form-select">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="form-select">
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map((member) => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="form-select">
                {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button onClick={addTask} className="btn-primary">Add</button>
              <button onClick={() => setShowAddTask(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Categories and Tasks */}
        <div className="categories-section">
          {Object.entries(data).map(([catId, { name, color, features }]) => {
            const cs = stats.catStats[catId];
            const visible = filteredFeatures(features);
            if (visible.length === 0) return null;
            return (
              <div key={catId} className="category-card" style={{ '--category-color': color }}>
                <div className="category-header">
                  <div className="category-title">
                    <div className="category-dot" />
                    <span>{name}</span>
                  </div>
                  <span className="category-stats">
                    {cs.done}/{cs.total} · {cs.pct}%
                  </span>
                </div>

                <div className="category-progress">
                  <div className="category-progress-fill" style={{ width: `${cs.pct}%` }} />
                </div>

                <div className="task-list">
                  {visible.map((f, i) => {
                    const priority = PRIORITY_CONFIG[f.priority];
                    const commentCount = getCommentCount(f.id);
                    const isExpanded = expandedTaskId === f.id;

                    return (
                      <div key={f.id} className="task-item-wrapper">
                        <div className={`task-item ${f.done ? 'done' : ''}`}>
                          <span onClick={() => toggle(catId, f.id)} className="task-checkbox" style={{ color: f.done ? color : undefined }}>
                            {f.done ? CHECK : EMPTY}
                          </span>

                          <div className="priority-badge" style={{ background: priority.bgColor, color: priority.color }}>
                            {priority.label[0]}
                          </div>

                          <span onClick={() => toggle(catId, f.id)} className="task-name">
                            {f.name}
                          </span>

                          {f.assigned_to && (
                            <div className="assignee-badge">
                              {f.assigned_to}
                            </div>
                          )}

                          <button onClick={() => setExpandedTaskId(isExpanded ? null : f.id)} className={`comment-btn ${commentCount > 0 ? 'has-comments' : ''}`}>
                            {COMMENT_ICON}
                            {commentCount > 0 && <span className="comment-count">{commentCount}</span>}
                          </button>

                          <button onClick={() => deleteTask(catId, f.id)} className="delete-btn">
                            {TRASH}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="comments-section">
                            <div className="comments-list">
                              {getTaskComments(f.id).length === 0 ? (
                                <div className="no-comments">No comments yet. Start the discussion!</div>
                              ) : (
                                getTaskComments(f.id).map((comment) => (
                                  <div key={comment.id} className="comment">
                                    <div className="comment-header">
                                      <span className="comment-author">{comment.author}</span>
                                      <span className="comment-date">
                                        {new Date(comment.created_at).toLocaleString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <div className="comment-content">{comment.content}</div>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="add-comment">
                              <select
                                value={newComment.split("::")[0] || ""}
                                onChange={(e) => {
                                  const author = e.target.value;
                                  const content = newComment.split("::")[1] || "";
                                  setNewComment(`${author}::${content}`);
                                }}
                                className="comment-select"
                              >
                                <option value="">Your name</option>
                                {TEAM_MEMBERS.map((member) => (
                                  <option key={member} value={member}>{member}</option>
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
                                className="comment-input"
                              />
                              <button onClick={() => addComment(f.id)} className="send-btn">
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
        </div>

        {/* Footer */}
        <div className="footer-note">
          <span className="sync-badge">✓ Live sync enabled</span> — Changes are shared instantly with your entire team. Everyone sees updates in real-time.
        </div>
      </div>
    </div>
  );
}
