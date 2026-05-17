import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getWeeklyAnalytics,
  getMonthlyAnalytics 
} from '../api/expenses'

const CATEGORIES = [
  { value: 'all', label: 'All', icon: 'ti-wallet', color: 'slate' },
  { value: 'food', label: 'Food', icon: 'ti-tools-kitchen-2', color: 'orange' },
  { value: 'groceries', label: 'Groceries', icon: 'ti-shopping-cart', color: 'green' },
  { value: 'travel', label: 'Travel', icon: 'ti-plane', color: 'blue' },
  { value: 'petrol', label: 'Petrol', icon: 'ti-gas-station', color: 'red' },
  { value: 'other', label: 'Other', icon: 'ti-dots', color: 'purple' },
]

const CAT_COLORS = {
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  groceries: 'bg-green-50 text-green-700 border-green-200',
  travel: 'bg-blue-50 text-blue-700 border-blue-200',
  petrol: 'bg-red-50 text-red-700 border-red-200',
  other: 'bg-purple-50 text-purple-700 border-purple-200',
}

const EMPTY_FORM = { amount: '', category: 'food', description: '', expense_date: '' }

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list') // 'list', 'weekly', 'monthly'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newExpense, setNewExpense] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [weeklyData, setWeeklyData] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)

  // ── Data loading ───────────────────────────────────────────

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getExpenses()
      setExpenses(data)
    } catch {
      setError('Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadWeeklyAnalytics = useCallback(async () => {
    try {
      const data = await getWeeklyAnalytics()
      setWeeklyData(data)
    } catch {
      setError('Failed to load weekly analytics.')
    }
  }, [])

  const loadMonthlyAnalytics = useCallback(async () => {
    try {
      const now = new Date()
      const data = await getMonthlyAnalytics(now.getFullYear(), now.getMonth() + 1)
      setMonthlyData(data)
    } catch {
      setError('Failed to load monthly analytics.')
    }
  }, [])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  useEffect(() => {
    if (view === 'weekly' && !weeklyData) {
      loadWeeklyAnalytics()
    } else if (view === 'monthly' && !monthlyData) {
      loadMonthlyAnalytics()
    }
  }, [view, weeklyData, monthlyData, loadWeeklyAnalytics, loadMonthlyAnalytics])

  // ── Create ─────────────────────────────────────────────────

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newExpense.amount || !newExpense.category) return
    setAdding(true)

    const payload = {
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description.trim() || null,
      expense_date: newExpense.expense_date || toDateStr(new Date()),
    }

    try {
      const saved = await createExpense(payload)
      setExpenses((p) => [saved, ...p])
      setNewExpense(EMPTY_FORM)
      setShowForm(false)
      // Refresh analytics
      setWeeklyData(null)
      setMonthlyData(null)
    } catch {
      setError('Failed to create expense.')
    } finally {
      setAdding(false)
    }
  }

  // ── Edit ───────────────────────────────────────────────────

  const startEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      expense_date: expense.expense_date,
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.amount) return
    const id = editingId
    const updates = {
      amount: parseFloat(editForm.amount),
      category: editForm.category,
      description: editForm.description.trim() || null,
      expense_date: editForm.expense_date,
    }

    try {
      const updated = await updateExpense(id, updates)
      setExpenses((p) => p.map((exp) => exp.id === id ? updated : exp))
      setEditingId(null)
      setWeeklyData(null)
      setMonthlyData(null)
    } catch {
      setError('Failed to update expense.')
    }
  }

  // ── Delete ─────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (editingId === id) setEditingId(null)
    setExpenses((p) => p.filter((exp) => exp.id !== id))
    try {
      await deleteExpense(id)
      setWeeklyData(null)
      setMonthlyData(null)
    } catch {
      loadExpenses()
    }
  }

  // ── Derived state ──────────────────────────────────────────

  const filtered = filter === 'all'
    ? expenses
    : expenses.filter((exp) => exp.category === filter)

  const totalAmount = filtered.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  // ── Render ─────────────────────────────────────────────────

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Expenses</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {expenses.length} transactions · {formatCurrency(totalAmount)} total
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setNewExpense(EMPTY_FORM) }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-700 active:scale-[.98] sm:w-auto"
          >
            <i className="ti ti-plus" />
            Add Expense
          </button>
        </div>

        {/* View Toggle */}
        <div className="mb-5 flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              view === 'list'
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <i className="ti ti-list mr-2" />
            List
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              view === 'weekly'
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <i className="ti ti-calendar-week mr-2" />
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              view === 'monthly'
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <i className="ti ti-calendar-month mr-2" />
            Monthly
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-5 space-y-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                placeholder="Amount (₹)"
                autoFocus
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-all focus:border-violet-400 focus:outline-none"
              >
                {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <input
              type="date"
              value={newExpense.expense_date || toDateStr(new Date())}
              onChange={(e) => setNewExpense((p) => ({ ...p, expense_date: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-all focus:border-violet-400 focus:outline-none"
            />
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewExpense(EMPTY_FORM) }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding || !newExpense.amount}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-40"
              >
                {adding ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Content based on view */}
        {view === 'list' && (
          <ListView
            loading={loading}
            expenses={filtered}
            filter={filter}
            setFilter={setFilter}
            categories={CATEGORIES}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setEditingId(null)}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        )}

        {view === 'weekly' && (
          <WeeklyView data={weeklyData} loading={!weeklyData} />
        )}

        {view === 'monthly' && (
          <MonthlyView data={monthlyData} loading={!monthlyData} />
        )}
      </div>
    </Layout>
  )
}

// ── List View ──────────────────────────────────────────────

function ListView({ 
  loading, 
  expenses, 
  filter, 
  setFilter, 
  categories,
  editingId,
  editForm,
  setEditForm,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete 
}) {
  return (
    <>
      {/* Category Filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map(({ value, label, icon }) => {
          const count = value === 'all'
            ? expenses.length
            : expenses.filter((exp) => exp.category === value).length
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                filter === value
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <i className={`${icon} text-sm`} />
              {label}
              <span className={`text-xs ${filter === value ? 'text-violet-500' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-slate-500">Loading expenses...</div>
      )}

      {!loading && expenses.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center shadow-sm">
          <i className="ti ti-wallet mb-3 block text-3xl text-slate-300" />
          <p className="mb-3 text-sm text-slate-500">
            {filter !== 'all' ? `No ${filter} expenses yet.` : 'No expenses yet.'}
          </p>
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div className="space-y-2">
          {expenses.map((expense) =>
            editingId === expense.id ? (
              <EditRow
                key={expense.id}
                form={editForm}
                setForm={setEditForm}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            ) : (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )
          )}
        </div>
      )}
    </>
  )
}

// ── Expense Row ────────────────────────────────────────────

function ExpenseRow({ expense, onEdit, onDelete }) {
  const category = CATEGORIES.find(c => c.value === expense.category)
  
  return (
    <div className="group rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${CAT_COLORS[expense.category]}`}>
          <i className={`${category?.icon} text-lg`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-sm font-medium text-slate-800">
                {expense.description || category?.label || 'Expense'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {new Date(expense.expense_date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC'
                })}
              </span>
            </div>
            <span className="text-base font-semibold text-slate-900">
              {formatCurrency(expense.amount)}
            </span>
          </div>

          {expense.description && (
            <span className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${CAT_COLORS[expense.category]}`}>
              {category?.label}
            </span>
          )}
        </div>

        <div className="ml-2 flex flex-col items-center gap-1 self-stretch sm:ml-0 sm:flex-row sm:self-start sm:opacity-0 sm:transition-all sm:group-hover:opacity-100">
          <button
            onClick={() => onEdit(expense)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            <i className="ti ti-pencil text-sm" />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <i className="ti ti-trash text-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Row ───────────────────────────────────────────────

function EditRow({ form, setForm, onSave, onCancel }) {
  return (
    <form
      onSubmit={onSave}
      className="space-y-2.5 rounded-xl border border-violet-200 bg-violet-50/50 p-3 shadow-sm"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          autoFocus
          required
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-violet-400 focus:outline-none"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-violet-400 focus:outline-none"
        >
          {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:border-violet-400 focus:outline-none"
      />
      <input
        type="date"
        value={form.expense_date}
        onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-violet-400 focus:outline-none"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 transition-all hover:border-slate-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Weekly View ────────────────────────────────────────────

function WeeklyView({ data, loading }) {
  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading weekly data...</div>
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-medium text-slate-600">Weekly Total</h3>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.total)}</p>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(data.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(data.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </div>

      {/* By Category */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">By Category</h3>
        <div className="space-y-3">
          {data.byCategory.map((item) => {
            const category = CATEGORIES.find(c => c.value === item.category)
            const percentage = data.total > 0 ? (item.total / data.total) * 100 : 0
            return (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <i className={`${category?.icon} text-base`} />
                    {category?.label}
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full bg-${category?.color}-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{item.count} transactions</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Breakdown */}
      {data.byDay.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Daily Breakdown</h3>
          <div className="space-y-2">
            {data.byDay.map((item) => (
              <div key={item.date} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">
                  {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Monthly View ───────────────────────────────────────────

function MonthlyView({ data, loading }) {
  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading monthly data...</div>
  }

  if (!data) return null

  const monthName = new Date(data.year, data.month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-medium text-slate-600">Monthly Total</h3>
        <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.total)}</p>
        <p className="mt-1 text-xs text-slate-500">{monthName}</p>
      </div>

      {/* By Category */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">By Category</h3>
        <div className="space-y-3">
          {data.byCategory.map((item) => {
            const category = CATEGORIES.find(c => c.value === item.category)
            const percentage = data.total > 0 ? (item.total / data.total) * 100 : 0
            return (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <i className={`${category?.icon} text-base`} />
                    {category?.label}
                  </span>
                  <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full bg-${category?.color}-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.count} transactions · {percentage.toFixed(1)}%
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Breakdown */}
      {data.byWeek.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Weekly Breakdown</h3>
          <div className="space-y-2">
            {data.byWeek.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">
                  Week {idx + 1} · {new Date(item.weekStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob
