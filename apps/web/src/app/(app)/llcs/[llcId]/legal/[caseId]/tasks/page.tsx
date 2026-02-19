'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedToUserId?: string;
  completedAt?: string;
  createdAt?: string;
}

interface TasksPageProps {
  params: Promise<{ llcId: string; caseId: string }>;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  canceled: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
};

function formatDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'completed' || status === 'canceled') return false;
  const due = new Date(dueDate.slice(0, 10) + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function toDateInputValue(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Modal Component                                                     */
/* ------------------------------------------------------------------ */
function TaskModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task Form (shared between Add and Edit)                             */
/* ------------------------------------------------------------------ */
function TaskForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
  showStatus,
}: {
  initialValues: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
  };
  onSubmit: (values: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
  }) => void;
  submitting: boolean;
  submitLabel: string;
  showStatus: boolean;
}) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [priority, setPriority] = useState(initialValues.priority);
  const [status, setStatus] = useState(initialValues.status);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ title, description, dueDate, priority, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="modal-title" className="block text-sm font-medium mb-1">
          Title *
        </label>
        <input
          id="modal-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. File response to motion"
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <div className={`grid ${showStatus ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        <div>
          <label htmlFor="modal-dueDate" className="block text-sm font-medium mb-1">
            Due Date *
          </label>
          <input
            id="modal-dueDate"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <div>
          <label htmlFor="modal-priority" className="block text-sm font-medium mb-1">
            Priority
          </label>
          <select
            id="modal-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        {showStatus && (
          <div>
            <label htmlFor="modal-status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              id="modal-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="modal-desc" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="modal-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about this task..."
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function TasksPage({ params }: TasksPageProps) {
  const { llcId, caseId } = use(params);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks`);
      const data = await res.json();

      if (data.ok) {
        setTasks(data.data);
      } else {
        setError(data.error?.message || 'Failed to load tasks');
      }
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [llcId, caseId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (values: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
  }) => {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description || undefined,
          dueDate: new Date(values.dueDate).toISOString(),
          priority: values.priority,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setTasks((prev) => [...prev, data.data]);
        setShowAddModal(false);
      } else {
        alert(data.error?.message || 'Failed to create task');
      }
    } catch {
      alert('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (values: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
  }) => {
    if (!editingTask) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/llcs/${llcId}/cases/${caseId}/tasks/${editingTask.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            description: values.description || undefined,
            dueDate: new Date(values.dueDate).toISOString(),
            priority: values.priority,
            status: values.status,
          }),
        }
      );

      const data = await res.json();

      if (data.ok) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data.data : t)));
        setEditingTask(null);
      } else {
        alert(data.error?.message || 'Failed to update task');
      }
    } catch {
      alert('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.ok) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
      } else {
        alert(data.error?.message || 'Failed to update task');
      }
    } catch {
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete task "${taskTitle}"?`)) return;

    try {
      const res = await fetch(`/api/llcs/${llcId}/cases/${caseId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        alert(data.error?.message || 'Failed to delete task');
      }
    } catch {
      alert('Failed to delete task');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/llcs/${llcId}/legal/${caseId}`}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            &larr; Case
          </Link>
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + Add Task
        </button>
      </div>

      {error && <div className="mb-4 text-destructive text-sm">{error}</div>}

      {tasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No tasks yet.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <div
                key={task.id}
                className={`p-4 border rounded-lg ${
                  overdue ? 'border-red-300 bg-red-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() =>
                        handleStatusChange(
                          task.id,
                          task.status === 'completed' ? 'pending' : 'completed'
                        )
                      }
                      className="w-4 h-4 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-muted-foreground'
                            : ''
                        }`}
                      >
                        {task.title}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`text-xs ${
                            overdue
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {overdue ? 'Overdue: ' : 'Due: '}
                          {formatDate(task.dueDate)}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            PRIORITY_STYLES[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            STATUS_STYLES[task.status]
                          }`}
                        >
                          {STATUS_LABELS[task.status] || task.status}
                        </span>
                      </div>

                      {(task.completedAt || task.createdAt) && (
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {task.createdAt && (
                            <span>Created {formatDateTime(task.createdAt)}</span>
                          )}
                          {task.completedAt && (
                            <span>Completed {formatDateTime(task.completedAt)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <TaskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Task"
      >
        <TaskForm
          initialValues={{
            title: '',
            description: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending',
          }}
          onSubmit={handleAddTask}
          submitting={submitting}
          submitLabel="Add Task"
          showStatus={false}
        />
      </TaskModal>

      {/* Edit Task Modal */}
      <TaskModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        {editingTask && (
          <TaskForm
            key={editingTask.id}
            initialValues={{
              title: editingTask.title,
              description: editingTask.description || '',
              dueDate: toDateInputValue(editingTask.dueDate),
              priority: editingTask.priority,
              status: editingTask.status,
            }}
            onSubmit={handleEditTask}
            submitting={submitting}
            submitLabel="Save Changes"
            showStatus={true}
          />
        )}
      </TaskModal>
    </div>
  );
}
