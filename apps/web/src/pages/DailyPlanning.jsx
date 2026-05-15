import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { getTodayPlan, saveMorningPlan, saveEveningReview } from '../api/dailyPlans'

const MOOD_OPTIONS = [
  { value: 'amazing', emoji: '🤩', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
]

export default function DailyPlanning() {
  const [mode, setMode] = useState('morning') // 'morning' or 'evening'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState(null)
  
  // Morning state
  const [priority1, setPriority1] = useState('')
  const [priority2, setPriority2] = useState('')
  const [priority3, setPriority3] = useState('')
  const [morningNotes, setMorningNotes] = useState('')
  const [morningMood, setMorningMood] = useState('')
  const [morningEnergy, setMorningEnergy] = useState(3)
  
  // Evening state
  const [eveningNotes, setEveningNotes] = useState('')
  const [eveningMood, setEveningMood] = useState('')
  const [eveningEnergy, setEveningEnergy] = useState(3)
  const [dayRating, setDayRating] = useState(3)
  const [wins, setWins] = useState('')
  const [improvements, setImprovements] = useState('')
  const [gratitude, setGratitude] = useState('')

  useEffect(() => {
    loadPlan()
  }, [])

  const loadPlan = async () => {
    setLoading(true)
    try {
      const data = await getTodayPlan()
      setPlan(data)
      
      // Load morning data
      if (data.priority_1) setPriority1(data.priority_1)
      if (data.priority_2) setPriority2(data.priority_2)
      if (data.priority_3) setPriority3(data.priority_3)
      if (data.morning_notes) setMorningNotes(data.morning_notes)
      if (data.morning_mood) setMorningMood(data.morning_mood)
      if (data.morning_energy) setMorningEnergy(data.morning_energy)
      
      // Load evening data
      if (data.evening_notes) setEveningNotes(data.evening_notes)
      if (data.evening_mood) setEveningMood(data.evening_mood)
      if (data.evening_energy) setEveningEnergy(data.evening_energy)
      if (data.day_rating) setDayRating(data.day_rating)
      if (data.wins) setWins(data.wins)
      if (data.improvements) setImprovements(data.improvements)
      if (data.gratitude) setGratitude(data.gratitude)
      
      // Auto-detect mode based on time and completion
      const hour = new Date().getHours()
      if (data.morning_completed_at && !data.evening_completed_at && hour >= 17) {
        setMode('evening')
      } else if (!data.morning_completed_at) {
        setMode('morning')
      } else if (data.evening_completed_at) {
        setMode('evening') // Show completed evening review
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMorning = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      await saveMorningPlan({
        plan_date: today,
        priority_1: priority1,
        priority_2: priority2,
        priority_3: priority3,
        morning_notes: morningNotes,
        morning_mood: morningMood,
        morning_energy: morningEnergy,
      })
      
      await loadPlan()
      
      // Show success message
      alert('Morning plan saved! Have a productive day! 🚀')
    } catch (err) {
      console.error(err)
      alert('Failed to save morning plan')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEvening = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      await saveEveningReview({
        plan_date: today,
        evening_notes: eveningNotes,
        evening_mood: eveningMood,
        evening_energy: eveningEnergy,
        day_rating: dayRating,
        wins: wins,
        improvements: improvements,
        gratitude: gratitude,
      })
      
      await loadPlan()
      
      // Show success message
      alert('Evening review saved! Rest well and see you tomorrow! 🌙')
    } catch (err) {
      console.error(err)
      alert('Failed to save evening review')
    } finally {
      setSaving(false)
    }
  }

  const morningCompleted = plan?.morning_completed_at
  const eveningCompleted = plan?.evening_completed_at

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Planning</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        )}

        {!loading && (
          <>
            {/* Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-2 flex gap-2"
            >
              <button
                onClick={() => setMode('morning')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'morning'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="ti ti-sunrise text-xl mr-2" />
                Morning Routine
                {morningCompleted && <i className="ti ti-check ml-2 text-lg" />}
              </button>
              <button
                onClick={() => setMode('evening')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  mode === 'evening'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="ti ti-moon text-xl mr-2" />
                Evening Review
                {eveningCompleted && <i className="ti ti-check ml-2 text-lg" />}
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {mode === 'morning' ? (
                <motion.div
                  key="morning"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card p-6"
                >
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-3">
                      <i className="ti ti-sunrise text-3xl text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Good Morning! 🌅</h2>
                    <p className="text-gray-600">Let's plan your day for success</p>
                  </div>

                  <form onSubmit={handleSaveMorning} className="space-y-6">
                    {/* Top 3 Priorities */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-target text-lg mr-1" />
                        Top 3 Priorities (MIT - Most Important Tasks)
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold">
                            1
                          </span>
                          <input
                            type="text"
                            value={priority1}
                            onChange={(e) => setPriority1(e.target.value)}
                            placeholder="Your #1 priority today..."
                            className="input flex-1"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                            2
                          </span>
                          <input
                            type="text"
                            value={priority2}
                            onChange={(e) => setPriority2(e.target.value)}
                            placeholder="Your #2 priority today..."
                            className="input flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                            3
                          </span>
                          <input
                            type="text"
                            value={priority3}
                            onChange={(e) => setPriority3(e.target.value)}
                            placeholder="Your #3 priority today..."
                            className="input flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Morning Mood */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-mood-smile text-lg mr-1" />
                        How are you feeling?
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() => setMorningMood(mood.value)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              morningMood === mood.value
                                ? 'border-violet-500 bg-violet-50 scale-105'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-2xl mr-2">{mood.emoji}</span>
                            <span className="text-sm font-medium">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energy Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-battery text-lg mr-1" />
                        Energy Level: {morningEnergy}/5
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={morningEnergy}
                        onChange={(e) => setMorningEnergy(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Morning Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className="ti ti-notes text-lg mr-1" />
                        Morning Notes (Optional)
                      </label>
                      <textarea
                        value={morningNotes}
                        onChange={(e) => setMorningNotes(e.target.value)}
                        placeholder="Any thoughts, intentions, or reminders for today..."
                        className="input resize-none"
                        rows="3"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={saving || !priority1}
                      className="btn btn-primary w-full text-lg py-3"
                    >
                      {saving ? (
                        <>
                          <div className="spinner border-white" />
                          Saving...
                        </>
                      ) : morningCompleted ? (
                        <>
                          <i className="ti ti-refresh text-xl" />
                          Update Morning Plan
                        </>
                      ) : (
                        <>
                          <i className="ti ti-check text-xl" />
                          Start My Day
                        </>
                      )}
                    </button>

                    {morningCompleted && (
                      <p className="text-center text-sm text-emerald-600 font-medium">
                        ✓ Morning plan completed at {new Date(plan.morning_completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="evening"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card p-6"
                >
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-3">
                      <i className="ti ti-moon text-3xl text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Evening Reflection 🌙</h2>
                    <p className="text-gray-600">How was your day?</p>
                  </div>

                  <form onSubmit={handleSaveEvening} className="space-y-6">
                    {/* Day Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-star text-lg mr-1" />
                        Rate Your Day: {dayRating}/5
                      </label>
                      <div className="flex gap-2 justify-center mb-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setDayRating(rating)}
                            className="transition-transform hover:scale-110"
                          >
                            <i
                              className={`ti ti-star${
                                rating <= dayRating ? '-filled' : ''
                              } text-3xl ${
                                rating <= dayRating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Evening Mood */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-mood-smile text-lg mr-1" />
                        How are you feeling now?
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() => setEveningMood(mood.value)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              eveningMood === mood.value
                                ? 'border-indigo-500 bg-indigo-50 scale-105'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-2xl mr-2">{mood.emoji}</span>
                            <span className="text-sm font-medium">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energy Level */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <i className="ti ti-battery text-lg mr-1" />
                        Energy Level: {eveningEnergy}/5
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={eveningEnergy}
                        onChange={(e) => setEveningEnergy(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Exhausted</span>
                        <span>Energized</span>
                      </div>
                    </div>

                    {/* Wins */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className="ti ti-trophy text-lg mr-1" />
                        Today's Wins 🎉
                      </label>
                      <textarea
                        value={wins}
                        onChange={(e) => setWins(e.target.value)}
                        placeholder="What went well today? What are you proud of?"
                        className="input resize-none"
                        rows="3"
                      />
                    </div>

                    {/* Improvements */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className="ti ti-bulb text-lg mr-1" />
                        What Could Be Better? 💡
                      </label>
                      <textarea
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        placeholder="What would you do differently? What did you learn?"
                        className="input resize-none"
                        rows="3"
                      />
                    </div>

                    {/* Gratitude */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className="ti ti-heart text-lg mr-1" />
                        Gratitude 🙏
                      </label>
                      <textarea
                        value={gratitude}
                        onChange={(e) => setGratitude(e.target.value)}
                        placeholder="What are you grateful for today?"
                        className="input resize-none"
                        rows="2"
                      />
                    </div>

                    {/* Evening Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <i className="ti ti-notes text-lg mr-1" />
                        Evening Notes (Optional)
                      </label>
                      <textarea
                        value={eveningNotes}
                        onChange={(e) => setEveningNotes(e.target.value)}
                        placeholder="Any final thoughts or reflections..."
                        className="input resize-none"
                        rows="2"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary w-full text-lg py-3"
                    >
                      {saving ? (
                        <>
                          <div className="spinner border-white" />
                          Saving...
                        </>
                      ) : eveningCompleted ? (
                        <>
                          <i className="ti ti-refresh text-xl" />
                          Update Evening Review
                        </>
                      ) : (
                        <>
                          <i className="ti ti-check text-xl" />
                          Complete Day
                        </>
                      )}
                    </button>

                    {eveningCompleted && (
                      <p className="text-center text-sm text-indigo-600 font-medium">
                        ✓ Evening review completed at {new Date(plan.evening_completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Show priorities in evening mode */}
            {mode === 'evening' && morningCompleted && (priority1 || priority2 || priority3) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 bg-gradient-to-br from-violet-50 to-purple-50"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <i className="ti ti-target text-xl mr-2" />
                  Today's Priorities
                </h3>
                <div className="space-y-2">
                  {priority1 && (
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <p className="text-gray-700">{priority1}</p>
                    </div>
                  )}
                  {priority2 && (
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <p className="text-gray-700">{priority2}</p>
                    </div>
                  )}
                  {priority3 && (
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <p className="text-gray-700">{priority3}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

// Made with Bob
