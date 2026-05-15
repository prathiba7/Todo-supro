import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  getGoals,
  createGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
} from '../api/goals'

const EMPTY_FORM = { title: '', description: '', target_date: '' }

// ── Helpers ────────────────────────────────────────────────

function daysLeft(targetDate) {
  if (!targetDate) return null
  const iso = targetDate.split('T')[0]
  return Math.ceil((new Date(iso + 'T12:00:00') - new Date()) / 86_400_000)
}

function formatDate(targetDate) {
  if (!targetDate) return ''
  const iso = targetDate.split('T')[0]
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Page ───────────────────────────────────────────────

export default function Goals() {
  const [goals,      setGoals]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [adding,     setAdding]     = useState(false)
  const [newGoal,    setNewGoal]    = useState(EMPTY_FORM)
  const [editingId,  setEditingId]  = useState(null)
  const [editForm,   setEditForm]   = useState(EMPTY_FORM)
  const [progressId, setProgressId] = useState(null) // goal with open slider
  const [progressVal,setProgressVal]= useState(0)

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    setLoading(true)
    setError(null)
    try {
      setGoals(await getGoals())
    } catch {
      setError('Failed to load goals.')
    } finally {
      setLoading(false)
    }
  }

  // ── Create ─────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newGoal.title.trim()) return
    setAdding(true)
    try {
      const saved = await createGoal({
        title:       newGoal.title.trim(),
        description: newGoal.description.trim() || null,
        target_date: newGoal.target_date || null,
      })
      setGoals((p) => [...p, saved])
      setNewGoal(EMPTY_FORM)
      setShowForm(false)
    } catch {
      setError('Failed to create goal.')
    } finally {
      setAdding(false)
    }
  }

  // ── Edit ───────────────────────────────────────────────────

  const startEdit = (goal) => {
    setEditingId(goal.id)
    setProgressId(null)
    setEditForm({
      title:       goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    const id      = editingId
    const updates = {
      title:       editForm.title.trim(),
      description: editForm.description.trim() || null,
      target_date: editForm.target_date || null,
    }
    setGoals((p) => p.map((g) => g.id === id ? { ...g, ...updates } : g))
    setEditingId(null)
    try {
      const updated = await updateGoal(id, updates)
      setGoals((p) => p.map((g) => g.id === id ? updated : g))
    } catch {
      loadGoals()
    }
  }

  // ── Progress ───────────────────────────────────────────────

  const openProgress = (goal) => {
    setProgressId(goal.id)
    setProgressVal(Math.min(100, Math.max(0, goal.progress ?? 0)))
    setEditingId(null)
  }

  const handleSaveProgress = async (id) => {
    const val = Math.min(100, Math.max(0, Math.round(Number(progressVal))))
    setGoals((p) => p.map((g) => g.id === id ? { ...g, progress: val } : g))
    setProgressId(null)
    try {
      const updated = await updateGoalProgress(id, val)
      setGoals((p) => p.map((g) => g.id === id ? updated : g))
    } catch {
      loadGoals()
    }
  }

  // ── Delete ─────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (editingId  === id) setEditingId(null)
    if (progressId === id) setProgressId(null)
    setGoals((p) => p.filter((g) => g.id !== id))
    try { await deleteGoal(id) } catch { loadGoals() }
  }

  // ── Derived ────────────────────────────────────────────────

  const active    = goals.filter((g) => (g.progress ?? 0) < 100)
  const completed = goals.filter((g) => (g.progress ?? 0) >= 100)
  const overdue   = active.filter((g) =>
    g.target_date && daysLeft(g.target_date) < 0
  )

  // Sort active goals: overdue first, then soonest deadline, then no date
  const sortedActive = [...active].sort((a, b) => {
    const da = daysLeft(a.target_date)
    const db = daysLeft(b.target_date)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  // ── Render ─────────────────────────────────────────────────

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Goals</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {active.length} active
              {completed.length > 0 && ` · ${completed.length} completed`}
              {overdue.length > 0 && (
                <span className="text-red-400"> · {overdue.length} overdue</span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setNewGoal(EMPTY_FORM) }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400 active:scale-[.98] sm:w-auto"
          >
            <i className="ti ti-plus" aria-hidden="true" />
            New goal
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 space-y-3 rounded-xl border border-amber-800/30 bg-slate-900 p-4 sm:p-5"
          >
            <input
              value={newGoal.title}
              onChange={(e) => setNewGoal((p) => ({ ...p, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setShowForm(false); setNewGoal(EMPTY_FORM) }
              }}
              placeholder="What do you want to achieve?"
              autoFocus
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal((p) => ({ ...p, description: e.target.value }))}
              placeholder="Why does this matter? (optional)"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5">
              <i className="ti ti-calendar text-sm text-slate-500" aria-hidden="true" />
              <input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal((p) => ({ ...p, target_date: e.target.value }))}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-300 outline-none"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewGoal(EMPTY_FORM) }}
                className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-500 transition-all hover:border-slate-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding || !newGoal.title.trim()}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400 disabled:opacity-40"
              >
                {adding ? 'Creating...' : 'Create goal'}
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-600 text-sm">Loading goals...</div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
            {error}
            <button onClick={loadGoals} className="ml-3 underline text-red-300 hover:text-red-200">
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && goals.length === 0 && (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl py-14 text-center">
            <i className="ti ti-target text-3xl text-slate-800 block mb-3" aria-hidden="true" />
            <p className="text-slate-500 text-sm mb-3">No goals yet. Set your first one.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Create a goal →
            </button>
          </div>
        )}

        {/* Active goals */}
        {!loading && sortedActive.length > 0 && (
          <div className="space-y-4 mb-8">
            {sortedActive.map((goal) =>
              editingId === goal.id ? (
                <EditGoalCard
                  key={goal.id}
                  form={editForm}
                  setForm={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  progressOpen={progressId === goal.id}
                  progressVal={progressId === goal.id ? progressVal : goal.progress ?? 0}
                  onProgressChange={setProgressVal}
                  onOpenProgress={openProgress}
                  onSaveProgress={handleSaveProgress}
                  onCancelProgress={() => setProgressId(null)}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}

        {/* Completed goals */}
        {!loading && completed.length > 0 && (
          <div>
            <p className="text-xs text-slate-700 font-semibold uppercase tracking-widest mb-4">
              Completed · {completed.length}
            </p>
            <div className="space-y-4">
              {completed.map((goal) =>
                editingId === goal.id ? (
                  <EditGoalCard
                    key={goal.id}
                    form={editForm}
                    setForm={setEditForm}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progressOpen={false}
                    progressVal={goal.progress ?? 0}
                    onProgressChange={setProgressVal}
                    onOpenProgress={openProgress}
                    onSaveProgress={handleSaveProgress}
                    onCancelProgress={() => setProgressId(null)}
                    onEdit={startEdit}
                    onDelete={handleDelete}
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

function GoalCard({
  goal, progressOpen, progressVal,
  onProgressChange, onOpenProgress, onSaveProgress, onCancelProgress,
  onEdit, onDelete,
}) {
  const pct      = Math.min(100, Math.max(0, goal.progress ?? 0))
  const complete = pct >= 100
  const days     = daysLeft(goal.target_date)

  const daysLabel = () => {
    if (days === null)  return null
    if (complete)       return 'Achieved'
    if (days >   0)     return `${days}d left`
    if (days === 0)     return 'Due today'
    return `${Math.abs(days)}d overdue`
  }

  const daysColor = () => {
    if (complete)       return 'text-emerald-400'
    if (days === null)  return 'text-slate-600'
    if (days <  0)      return 'text-red-400'
    if (days <= 7)      return 'text-amber-400'
    return 'text-slate-500'
  }

  return (
    <div
      className={`group rounded-xl border bg-slate-900 p-4 sm:p-5 transition-all ${
        complete
          ? 'border-emerald-900/50'
          : days !== null && days < 0
          ? 'border-red-900/40'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {complete && (
              <span className="flex-shrink-0 rounded-md border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Complete
              </span>
            )}
            {!complete && days !== null && days < 0 && (
              <span className="flex-shrink-0 rounded-md border border-red-900 bg-red-950 px-2 py-0.5 text-xs font-medium text-red-400">
                Overdue
              </span>
            )}
            <h3
              className={`break-words text-sm font-semibold leading-snug ${
                complete ? 'text-slate-400 line-through' : 'text-white'
              }`}
            >
              {goal.title}
            </h3>
          </div>
          {goal.description && (
            <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{goal.description}</p>
          )}
        </div>

        <div className="ml-2 flex flex-col items-center gap-1 self-stretch sm:ml-0 sm:flex-row sm:self-start sm:opacity-0 sm:transition-all sm:group-hover:opacity-100">
          <button
            onClick={() => onEdit(goal)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-slate-800 hover:text-white"
            aria-label="Edit goal"
          >
            <i className="ti ti-pencil text-sm" aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-red-950/30 hover:text-red-400"
            aria-label="Delete goal"
          >
            <i className="ti ti-trash text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => !complete && onOpenProgress(goal)}
            disabled={complete}
            className={`flex items-center gap-1.5 text-left transition-all ${
              complete
                ? 'cursor-default text-emerald-400'
                : 'group/prog text-amber-400 hover:text-amber-300'
            }`}
            aria-label="Update progress"
          >
            <span className="text-xl font-bold tabular-nums">{pct}%</span>
            {!complete && (
              <i className="ti ti-pencil text-xs opacity-60 transition-all sm:opacity-0 sm:group-hover/prog:opacity-60" aria-hidden="true" />
            )}
          </button>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {goal.target_date && (
              <span className="tabular-nums text-slate-700">
                <i className="ti ti-calendar mr-1" aria-hidden="true" />
                {formatDate(goal.target_date)}
              </span>
            )}
            {days !== null && (
              <span className={`font-semibold ${daysColor()}`}>{daysLabel()}</span>
            )}
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              complete ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {progressOpen && !complete && (
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <input
              type="range"
              min="0" max="100" step="1"
              value={progressVal}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-left text-xs font-mono tabular-nums text-slate-400 sm:text-right">
              {Math.round(progressVal)}%
            </span>
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={() => onSaveProgress(goal.id)}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-all hover:bg-amber-400"
              >
                Save
              </button>
              <button
                onClick={onCancelProgress}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-500 transition-all hover:border-slate-700 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EditGoalCard({ form, setForm, onSave, onCancel }) {
  return (
    <form
      onSubmit={onSave}
      className="space-y-3 rounded-xl border border-amber-800/40 bg-slate-900 p-4 sm:p-5"
    >
      <input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
        autoFocus
        required
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description (optional)"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5">
        <i className="ti ti-calendar text-sm text-slate-500" aria-hidden="true" />
        <input
          type="date"
          value={form.target_date}
          onChange={(e) => setForm((p) => ({ ...p, target_date: e.target.value }))}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-300 outline-none"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-500 transition-all hover:border-slate-700 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400"
        >
          Save changes
        </button>
      </div>
    </form>
  )
}
