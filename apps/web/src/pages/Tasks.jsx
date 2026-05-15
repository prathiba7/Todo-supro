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
  personal: 'bg-slate-100 text-slate-600 border-slate-200',
  work:     'bg-blue-50 text-blue-700 border-blue-200',
  health:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  '75hard': 'bg-amber-50 text-amber-700 border-amber-200',
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
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tasks</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {tasks.length} total · {tasks.filter((t) => t.is_done).length} done
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setNewTask(EMPTY_FORM) }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-[.98] sm:w-auto"
          >
            <i className="ti ti-plus" aria-hidden="true" />
            New task
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <button
            onClick={() => shiftDate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900"
            aria-label="Previous day"
          >
            <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
          </button>

          <button
            onClick={() => { setDate(toDateStr(new Date())); setFilter('all') }}
            className={`min-w-0 flex-1 rounded-xl border px-4 py-2 text-center text-sm font-medium shadow-sm transition-all ${
              isToday
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
            }`}
          >
            {displayDate(date)}
          </button>

          <button
            onClick={() => shiftDate(1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-900"
            aria-label="Next day"
          >
            <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
          </button>

          {!isToday && (
            <button
              onClick={() => { setDate(toDateStr(new Date())); setFilter('all') }}
              className="w-full pl-1 text-left text-xs font-medium text-amber-700 transition-colors hover:text-amber-800 sm:w-auto sm:whitespace-nowrap"
            >
              ↩ Today
            </button>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label }) => {
            const count = value === 'all'
              ? tasks.length
              : tasks.filter((t) => t.category === value).length
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === value
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-xs ${filter === value ? 'text-amber-500' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm"
          >
            <input
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Escape') { setShowForm(false); setNewTask(EMPTY_FORM) } }}
              placeholder="What needs to be done?"
              autoFocus
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <i className="ti ti-clock text-sm text-slate-400" aria-hidden="true" />
                <input
                  type="time"
                  value={newTask.scheduled_time}
                  onChange={(e) => setNewTask((p) => ({ ...p, scheduled_time: e.target.value }))}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none sm:w-[90px]"
                />
              </div>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask((p) => ({ ...p, category: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-amber-400 focus:outline-none"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="75hard">75 Hard</option>
              </select>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTask(EMPTY_FORM) }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding || !newTask.title.trim()}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-600 disabled:opacity-40"
              >
                {adding ? 'Adding...' : 'Add task'}
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="py-16 text-center text-sm text-slate-500">Loading tasks...</div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
            <button onClick={loadTasks} className="ml-3 underline text-red-500 hover:text-red-700">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center shadow-sm">
            <i className="ti ti-clipboard-list mb-3 block text-3xl text-slate-300" aria-hidden="true" />
            <p className="mb-3 text-sm text-slate-500">
              {filter !== 'all' ? `No ${filter} tasks for this day.` : 'No tasks for this day.'}
            </p>
            {filter === 'all' ? (
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-medium text-amber-700 transition-colors hover:text-amber-800"
              >
                Add your first task →
              </button>
            ) : (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-slate-500 transition-colors hover:text-slate-700"
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
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
      className={`group rounded-xl border px-4 py-3 shadow-sm transition-all ${
        task.is_done
          ? 'border-slate-200 bg-slate-50 opacity-75'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            task.is_done
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-slate-300 hover:border-amber-500'
          }`}
          aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.is_done && (
            <i className="ti ti-check text-xs text-white" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span
            className={`block break-words text-sm leading-relaxed ${
              task.is_done ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}
          >
            {task.title}
          </span>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.scheduled_time && (
              <span className="flex flex-shrink-0 items-center gap-1 text-xs font-mono text-slate-500">
                <i className="ti ti-clock text-xs" aria-hidden="true" />
                {task.scheduled_time.slice(0, 5)}
              </span>
            )}

            {task.category && task.category !== 'personal' && (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                  catColors[task.category] || catColors.personal
                }`}
              >
                {task.category}
              </span>
            )}
          </div>
        </div>

        <div className="ml-2 flex flex-col items-center gap-1 self-stretch sm:ml-0 sm:flex-row sm:self-start sm:opacity-0 sm:transition-all sm:group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit task"
          >
            <i className="ti ti-pencil text-sm" aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
            aria-label="Delete task"
          >
            <i className="ti ti-trash text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

function EditRow({ form, setForm, onSave, onCancel }) {
  return (
    <form
      onSubmit={onSave}
      className="space-y-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-sm"
    >
      <input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
        autoFocus
        required
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <i className="ti ti-clock text-sm text-slate-400" aria-hidden="true" />
          <input
            type="time"
            value={form.scheduled_time}
            onChange={(e) => setForm((p) => ({ ...p, scheduled_time: e.target.value }))}
            className="w-full bg-transparent text-sm text-slate-700 outline-none sm:w-[90px]"
          />
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-amber-400 focus:outline-none"
        >
          <option value="personal">Personal</option>
          <option value="work">Work</option>
          <option value="health">Health</option>
          <option value="75hard">75 Hard</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-amber-600"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
