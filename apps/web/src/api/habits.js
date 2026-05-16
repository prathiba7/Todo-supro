import client from './client'

// Get all habits
export const getHabits = async () => {
  const { data } = await client.get('/habits')
  return data
}

// Create new habit
export const createHabit = async (habitData) => {
  const { data } = await client.post('/habits', habitData)
  return data
}

// Update habit
export const updateHabit = async (id, habitData) => {
  const { data } = await client.patch(`/habits/${id}`, habitData)
  return data
}

// Delete habit
export const deleteHabit = async (id) => {
  const { data } = await client.delete(`/habits/${id}`)
  return data
}

// Get today's habits with completion status
export const getTodayHabits = async () => {
  const { data } = await client.get('/habits/today')
  return data
}

// Get habits for a specific date
export const getHabitsByDate = async (date) => {
  const { data } = await client.get(`/habits/date/${date}`)
  return data
}

// Toggle habit completion for today
export const toggleHabit = async (id) => {
  const { data } = await client.post(`/habits/${id}/toggle`)
  return data
}

// Toggle habit completion for a specific date
export const toggleHabitForDate = async (id, date) => {
  const { data } = await client.post(`/habits/${id}/toggle`, { date })
  return data
}

// Get habit history
export const getHabitHistory = async (days = 75) => {
  const { data } = await client.get(`/habits/history?days=${days}`)
  return data
}

// Get current streak
export const getStreak = async () => {
  const { data } = await client.get('/habits/streak')
  return data
}

// Made with Bob
