import client from './client'

// Get today's plan
export const getTodayPlan = async () => {
  const { data } = await client.get('/daily-plans/today')
  return data
}

// Get plan for specific date
export const getPlanByDate = async (date) => {
  const { data } = await client.get(`/daily-plans/date/${date}`)
  return data
}

// Save morning plan
export const saveMorningPlan = async (planData) => {
  const { data } = await client.post('/daily-plans/morning', planData)
  return data
}

// Save evening review
export const saveEveningReview = async (reviewData) => {
  const { data } = await client.post('/daily-plans/evening', reviewData)
  return data
}

// Get plan history
export const getPlanHistory = async (days = 30) => {
  const { data } = await client.get(`/daily-plans/history?days=${days}`)
  return data
}

// Get planning statistics
export const getPlanStats = async () => {
  const { data } = await client.get('/daily-plans/stats')
  return data
}

// Made with Bob