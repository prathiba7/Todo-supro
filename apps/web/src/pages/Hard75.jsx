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
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">75 Hard</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {streak > 0 ? `${streak}-day streak` : 'Start your streak today'}
            {' · '}{totalComplete} of 75 days complete
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 text-slate-600 text-sm">Loading...</div>
        )}
        {error && !loading && (
          <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-6 text-sm text-red-400">
            {error}
            <button onClick={load} className="ml-3 underline text-red-300 hover:text-red-200">
              Retry
            </button>
          </div>
        )}

        {!loading && today && (
          <>
            {/* Stats + progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
                    Today's habits
                  </p>
                  <p className={`text-4xl font-bold tabular-nums ${allDone ? 'text-emerald-400' : 'text-white'}`}>
                    {doneCount}
                    <span className="text-slate-700 text-2xl">/5</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
                    Streak
                  </p>
                  <p className={`text-4xl font-bold tabular-nums ${streak >= 3 ? 'text-amber-400' : 'text-white'}`}>
                    {streak}
                    <span className="text-slate-700 text-2xl"> days</span>
                  </p>
                </div>
              </div>

              {/* 5-segment bar */}
              <div className="flex gap-1.5 mb-2">
                {HABITS.map(({ field }) => (
                  <div
                    key={field}
                    className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
                      today[field] ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {allDone && (
                <p className="text-xs text-emerald-500 text-center font-medium mt-1">
                  All 5 done — you're unstoppable today.
                </p>
              )}
            </div>

            {/* Habits checklist */}
            <div className="space-y-2.5 mb-8">
              {HABITS.map(({ field, icon, label, sub }) => {
                const done    = today[field] ?? false
                const pending = toggling.has(field)
                return (
                  <button
                    key={field}
                    onClick={() => handleToggle(field)}
                    disabled={pending}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                      done
                        ? 'bg-emerald-950/40 border-emerald-900/60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 active:scale-[.99]'
                    } ${pending ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? 'bg-emerald-900/50' : 'bg-slate-800'
                    }`}>
                      <i className={`ti ${icon} text-lg ${done ? 'text-emerald-400' : 'text-slate-500'}`} aria-hidden="true" />
                    </div>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition-all ${
                        done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-white'
                      }`}>
                        {label}
                      </p>
                      <p className={`text-xs mt-0.5 transition-all ${
                        done ? 'text-emerald-900' : 'text-slate-600'
                      }`}>
                        {sub}
                      </p>
                    </div>

                    {/* Check circle */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                    }`}>
                      {done && <i className="ti ti-check text-xs text-white" aria-hidden="true" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 75-day heatmap */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  75-day journey
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-700 inline-block" />All done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-800 inline-block" />Partial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block border border-slate-700" />Ahead
                  </span>
                </div>
              </div>

              {/* Grid: 15 cols × 5 rows = 75 cells */}
              <div
                className="gap-1.5"
                style={{ display:'grid', gridTemplateColumns:'repeat(15, 1fr)' }}
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
                      : cell.status === 'future'   ? 'bg-slate-900 border border-slate-800'
                      : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-600 mt-4 text-center">
                {totalComplete} / 75 days complete · {75 - totalComplete} to go
              </p>
            </div>

            {/* Daily quote */}
            <p className="text-center text-xs text-slate-700 italic px-4">
              "{quote}"
            </p>
          </>
        )}
      </div>
    </Layout>
  )
}
