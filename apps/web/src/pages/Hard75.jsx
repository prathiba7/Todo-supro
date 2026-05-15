import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getToday, toggleHabit, getStreak, getHistory } from '../api/hard75'

const HABITS = [
  { field:'workout1_done',         icon:'ti-run',     label:'Workout #1',       sub:'45 min minimum'   },
  { field:'workout2_outdoor_done', icon:'ti-trees',   label:'Outdoor workout',  sub:'Must be outside'  },
  { field:'water_done',            icon:'ti-droplet', label:'1 gallon water',   sub:'~3.8 litres'      },
  { field:'reading_done',          icon:'ti-book',    label:'Read 10 pages',    sub:'Non-fiction only' },
  { field:'photo_done',            icon:'ti-camera',  label:'Progress photo',   sub:'Front, side, back'},
]

const QUOTES = [
  "Day by day, you're becoming someone new.",
  "Discipline is the bridge between goals and accomplishment.",
  "Every rep. Every page. Every sip. It compounds.",
  "You said you would. Now prove it.",
  "Hard is what makes it worth it.",
]

// Build 75 cells (day 1 = 74 days ago, day 75 = today)
function buildHeatmap(history) {
  const logMap = {}
  history.forEach((d) => {
    logMap[d.log_date.split('T')[0]] = d
  })
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  return Array.from({ length: 75 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 74 + i)
    const iso = d.toISOString().split('T')[0]
    const log = logMap[iso]
    const isFuture = iso > todayStr

    const status =
      isFuture             ? 'future'
      : !log               ? 'missed'
      : log.all_done       ? 'complete'
      : log.done_count > 0 ? 'partial'
      :                      'missed'

    return {
      iso,
      isToday: iso === todayStr,
      label: d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }),
      status,
      day: i + 1,
    }
  })
}

export default function Hard75() {
  const [today,    setToday]    = useState(null)
  const [streak,   setStreak]   = useState(0)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [toggling, setToggling] = useState(new Set())

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [t, s, h] = await Promise.all([getToday(), getStreak(), getHistory()])
      setToday(t)
      setStreak(s.streak)
      setHistory(h)
    } catch {
      setError('Failed to load. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (field) => {
    if (toggling.has(field)) return
    setToggling((p) => new Set([...p, field]))
    // Optimistic flip
    setToday((p) => p ? { ...p, [field]: !p[field] } : p)
    try {
      const updated = await toggleHabit(field)
      setToday(updated)
      // Streak may have changed
      const { streak: s } = await getStreak()
      setStreak(s)
    } catch {
      setToday((p) => p ? { ...p, [field]: !p[field] } : p)
    } finally {
      setToggling((p) => { const n = new Set(p); n.delete(field); return n })
    }
  }

  const doneCount    = today ? HABITS.filter(({ field }) => today[field]).length : 0
  const allDone      = doneCount === 5
  const totalComplete= history.filter((d) => d.all_done).length
  const heatmap      = buildHeatmap(history)
  const quote        = QUOTES[new Date().getDate() % QUOTES.length]

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">75 Hard</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
            {' · '}{totalComplete} of 75 days complete
          </p>
        </div>

        {loading && (
          <div className="py-16 text-center text-sm text-slate-600">Loading...</div>
        )}
        {error && !loading && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
            {error}
            <button onClick={load} className="ml-3 underline text-red-300 hover:text-red-200">
              Retry
            </button>
          </div>
        )}

        {!loading && today && (
          <>
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Today's habits
                  </p>
                  <p className={`text-3xl font-bold tabular-nums sm:text-4xl ${allDone ? 'text-emerald-400' : 'text-white'}`}>
                    {doneCount}
                    <span className="text-2xl text-slate-700">/5</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Streak
                  </p>
                  <p className={`text-3xl font-bold tabular-nums sm:text-4xl ${streak >= 3 ? 'text-amber-400' : 'text-white'}`}>
                    {streak}
                    <span className="text-2xl text-slate-700"> days</span>
                  </p>
                </div>
              </div>

              <div className="mb-2 flex gap-1.5">
                {HABITS.map(({ field }) => (
                  <div
                    key={field}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                      today[field] ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {allDone && (
                <p className="mt-1 text-center text-xs font-medium text-emerald-500">
                  All 5 done — you're unstoppable today.
                </p>
              )}
            </div>

            <div className="mb-8 space-y-2.5">
              {HABITS.map(({ field, icon, label, sub }) => {
                const done    = today[field] ?? false
                const pending = toggling.has(field)
                return (
                  <button
                    key={field}
                    onClick={() => handleToggle(field)}
                    disabled={pending}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all sm:gap-4 sm:px-5 ${
                      done
                        ? 'border-emerald-900/60 bg-emerald-950/40'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700 active:scale-[.99]'
                    } ${pending ? 'cursor-wait opacity-60' : ''}`}
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                      done ? 'bg-emerald-900/50' : 'bg-slate-800'
                    }`}>
                      <i className={`ti ${icon} text-lg ${done ? 'text-emerald-400' : 'text-slate-500'}`} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold transition-all ${
                        done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-white'
                      }`}>
                        {label}
                      </p>
                      <p className={`mt-0.5 text-xs leading-relaxed transition-all ${
                        done ? 'text-emerald-900' : 'text-slate-600'
                      }`}>
                        {sub}
                      </p>
                    </div>

                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                    }`}>
                      {done && <i className="ti ti-check text-xs text-white" aria-hidden="true" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  75-day journey
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-emerald-700" />All done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-amber-800" />Partial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm border border-slate-700 bg-slate-800" />Ahead
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-1">
                <div
                  className="grid min-w-[420px] gap-1.5 sm:min-w-0"
                  style={{ gridTemplateColumns:'repeat(15, minmax(0, 1fr))' }}
                >
                  {heatmap.map((cell) => (
                    <div
                      key={cell.iso}
                      title={`Day ${cell.day} · ${cell.label} · ${cell.status}`}
                      className={`aspect-square rounded-md transition-all cursor-default ${
                        cell.isToday ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-slate-900' : ''
                      } ${
                        cell.status === 'complete' ? 'bg-emerald-700'
                        : cell.status === 'partial'  ? 'bg-amber-800'
                        : cell.status === 'future'   ? 'border border-slate-800 bg-slate-900'
                        : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-slate-600">
                {totalComplete} / 75 days complete · {75 - totalComplete} to go
              </p>
            </div>

            <p className="px-2 text-center text-xs italic text-slate-700 sm:px-4">
              "{quote}"
            </p>
          </>
        )}
      </div>
    </Layout>
  )
}
