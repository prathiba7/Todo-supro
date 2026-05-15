import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { getTasks, createTask, updateTask, toggleTask, deleteTask } from '../api/tasks'

const CATEGORIES = [
  { value: 'all',      label: 'All'      },
  { value: 'personal', label: 'Personal' },
  { value: 'work',     label: 'Work'     },
  { value: 'health',   label: 'Health'   },
  { value: '75hard',   label: '75 Hard'  },
]

const CAT_COLORS = {
  personal: 'bg-slate-800 text-slate-400 border-slate-700',
  work:     'bg-blue-950 text-blue-400 border-blue-800',
  health:   'bg-emerald-950 text-emerald-400 border-emerald-800',
  '75hard': 'bg-amber-950 text-amber-400 border-amber-800',
}

const EMPTY_FORM = { title: '', category: 'personal', scheduled_time: '' }

// Format a YYYY-MM-DD string as a human label
function displayDate(iso) {
  const d      = new Date(iso + 'T12:00:00')
  const today  = new Date(); today.setHours(12, 0, 0, 0)
  const target = new Date(d); target.setHours(12, 0, 0, 0)
  const diff   = Math.round((target - today) / 86_400_000)
  if (diff ===  0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff ===  1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
}

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

export default function Tasks() {
  const [tasks,     setTasks]     = useState([])
  const [date,      setDate]      = useState(toDateStr(new Date()))
  const [filter,    setFilter]    = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showForm,  setShowForm]  = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [newTask,   setNewTask]   = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm,  setEditForm]  = useState(EMPTY_FORM)

  // ── Data loading ───────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTasks(date)
      setTasks(data)
    } catch {
      setError('Failed to load tasks. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadTasks()
    setEditingId(null) // cancel any open edit when date changes
  }, [loadTasks])

  // ── Date navigation ────────────────────────────────────────

  const shiftDate = (days) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setDate(toDateStr(d))
    setFilter('all')
  }

  const isToday = date === toDateStr(new Date())

  // ── Create ─────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return
    setAdding(true)

    const payload = {
      title:          newTask.title.trim(),
      category:       newTask.category,
      scheduled_time: newTask.scheduled_time || null,
      task_date:      date,
    }

    // Optimistic: show immediately with a temp id
    const temp = { id: 'temp', ...payload, is_done: false }
    setTasks((p) => [...p, temp])
    setNewTask(EMPTY_FORM)
    setShowForm(false)

    try {
      const saved = await createTask(payload)
      setTasks((p) => p.map((t) => t.id === 'temp' ? saved : t))
    } catch {
      // Rollback
      setTasks((p) => p.filter((t) => t.id !== 'temp'))
      setNewTask(payload)
      setShowForm(true)
    } finally {
      setAdding(false)
    }
  }

  // ── Toggle done ────────────────────────────────────────────

  const handleToggle = async (id) => {
    setTasks((p) => p.map((t) => t.id === id ? { ...t, is_done: !t.is_done } : t))
    try {
      const updated = await toggleTask(id)
      setTasks((p) => p.map((t) => t.id === id ? updated : t))
    } catch {
      setTasks((p) => p.map((t) => t.id === id ? { ...t, is_done: !t.is_done } : t))
    }
  }

  // ── Edit ───────────────────────────────────────────────────

  const startEdit = (task) => {
    setEditingId(task.id)
    setEditForm({
      title:          task.title,
      category:       task.category || 'personal',
      scheduled_time: task.scheduled_time ? task.scheduled_time.slice(0, 5) : '',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim()) return
    const id = editingId
    const updates = {
      title:          editForm.title.trim(),
      category:       editForm.category,
      scheduled_time: editForm.scheduled_time || null,
    }
    // Optimistic
    setTasks((p) => p.map((t) => t.id === id ? { ...t, ...updates } : t))
    setEditingId(null)
    try {
      const updated = await updateTask(id, updates)
      setTasks((p) => p.map((t) => t.id === id ? updated : t))
    } catch {
      loadTasks() // resync on failure
    }
  }

  // ── Delete ─────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (editingId === id) setEditingId(null)
    setTasks((p) => p.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      loadTasks()
    }
  }

  // ── Derived state ──────────────────────────────────────────

  const filtered = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.category === filter)

  const todo = filtered.filter((t) => !t.is_done)
  const done = filtered.filter((t) =>  t.is_done)

  // ── Render ─────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Tasks</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {tasks.length} total · {tasks.filter((t) => t.is_done).length} done
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setNewTask(EMPTY_FORM) }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[.98] text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            <i className="ti ti-plus" aria-hidden="true" />
            New task
          </button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => shiftDate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            aria-label="Previous day"
          >
            <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
          </button>

          <button
            onClick={() => { setDate(toDateStr(new Date())); setFilter('all') }}
            className={`flex-1 text-center py-2 rounded-xl border text-sm font-medium transition-all ${
              isToday
                ? 'bg-amber-500/10 border-amber-800/50 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
            }`}
          >
            {displayDate(date)}
          </button>

          <button
            onClick={() => shiftDate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            aria-label="Next day"
          >
            <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
          </button>

          {!isToday && (
            <button
              onClick={() => { setDate(toDateStr(new Date())); setFilter('all') }}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap pl-1"
            >
              ↩ Today
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {CATEGORIES.map(({ value, label }) => {
            const count = value === 'all'
              ? tasks.length
              : tasks.filter((t) => t.category === value).length
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filter === value
                    ? 'bg-amber-500/15 text-amber-400 border-amber-800/50'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs ${filter === value ? 'text-amber-600' : 'text-slate-700'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Add task form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-slate-900 border border-amber-800/30 rounded-xl p-4 mb-5 space-y-3"
          >
            <input
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Escape') { setShowForm(false); setNewTask(EMPTY_FORM) } }}
              placeholder="What needs to be done?"
              autoFocus
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
                <i className="ti ti-clock text-slate-500 text-sm" aria-hidden="true" />
                <input
                  type="time"
                  value={newTask.scheduled_time}
                  onChange={(e) => setNewTask((p) => ({ ...p, scheduled_time: e.target.value }))}
                  className="bg-transparent text-sm text-slate-300 outline-none w-[90px]"
                />
              </div>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask((p) => ({ ...p, category: e.target.value }))}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition-all"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="75hard">75 Hard</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTask(EMPTY_FORM) }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding || !newTask.title.trim()}
                className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all disabled:opacity-40"
              >
                {adding ? 'Adding...' : 'Add task'}
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-600 text-sm">Loading tasks...</div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
            {error}
            <button onClick={loadTasks} className="ml-3 underline text-red-300 hover:text-red-200">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl py-14 text-center">
            <i className="ti ti-clipboard-list text-3xl text-slate-800 block mb-3" aria-hidden="true" />
            <p className="text-slate-500 text-sm mb-3">
              {filter !== 'all' ? `No ${filter} tasks for this day.` : 'No tasks for this day.'}
            </p>
            {filter === 'all' ? (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Add your first task →
              </button>
            ) : (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Show all categories
              </button>
            )}
          </div>
        )}

        {/* Todo tasks */}
        {!loading && todo.length > 0 && (
          <div className="space-y-2 mb-6">
            {todo.map((task) =>
              editingId === task.id ? (
                <EditRow
                  key={task.id}
                  form={editForm}
                  setForm={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  catColors={CAT_COLORS}
                />
              )
            )}
          </div>
        )}

        {/* Completed tasks */}
        {!loading && done.length > 0 && (
          <div>
            <p className="text-xs text-slate-700 font-semibold uppercase tracking-widest mb-3">
              Completed · {done.length}
            </p>
            <div className="space-y-2">
              {done.map((task) =>
                editingId === task.id ? (
                  <EditRow
                    key={task.id}
                    form={editForm}
                    setForm={setEditForm}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    catColors={CAT_COLORS}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── Sub-components ─────────────────────────────────────────

function TaskRow({ task, onToggle, onEdit, onDelete, catColors }) {
  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        task.is_done
          ? 'bg-slate-900/40 border-slate-800/40 opacity-55'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.is_done
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600 hover:border-amber-500'
        }`}
        aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.is_done && (
          <i className="ti ti-check text-xs text-white" aria-hidden="true" />
        )}
      </button>

      {/* Title */}
      <span
        className={`flex-1 text-sm ${
          task.is_done ? 'line-through text-slate-500' : 'text-slate-200'
        }`}
      >
        {task.title}
      </span>

      {/* Time badge */}
      {task.scheduled_time && (
        <span className="flex items-center gap-1 text-xs text-slate-600 font-mono flex-shrink-0">
          <i className="ti ti-clock text-xs" aria-hidden="true" />
          {task.scheduled_time.slice(0, 5)}
        </span>
      )}

      {/* Category badge */}
      {task.category && task.category !== 'personal' && (
        <span
          className={`text-xs px-2 py-0.5 rounded-md border font-medium flex-shrink-0 ${
            catColors[task.category] || catColors.personal
          }`}
        >
          {task.category}
        </span>
      )}

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all"
          aria-label="Edit task"
        >
          <i className="ti ti-pencil text-sm" aria-hidden="true" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-all"
          aria-label="Delete task"
        >
          <i className="ti ti-trash text-sm" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function EditRow({ form, setForm, onSave, onCancel }) {
  return (
    <form
      onSubmit={onSave}
      className="bg-slate-900 border border-amber-800/40 rounded-xl p-3 space-y-2.5"
    >
      <input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
        autoFocus
        required
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
      />
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
          <i className="ti ti-clock text-slate-500 text-sm" aria-hidden="true" />
          <input
            type="time"
            value={form.scheduled_time}
            onChange={(e) => setForm((p) => ({ ...p, scheduled_time: e.target.value }))}
            className="bg-transparent text-sm text-slate-300 outline-none w-[90px]"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition-all"
        >
          <option value="personal">Personal</option>
          <option value="work">Work</option>
          <option value="health">Health</option>
          <option value="75hard">75 Hard</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs text-slate-500 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
