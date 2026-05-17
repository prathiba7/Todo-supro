import client from './client'

export const getExpenses = async (filters = {}) => {
  const { data } = await client.get('/expenses', {
    params: filters,
  })
  return data
}

export const getWeeklyAnalytics = async (startDate) => {
  const { data } = await client.get('/expenses/analytics/weekly', {
    params: startDate ? { startDate } : {},
  })
  return data
}

export const getMonthlyAnalytics = async (year, month) => {
  const { data } = await client.get('/expenses/analytics/monthly', {
    params: { year, month },
  })
  return data
}

export const createExpense = async (expense) => {
  const { data } = await client.post('/expenses', expense)
  return data
}

export const updateExpense = async (id, updates) => {
  const { data } = await client.put(`/expenses/${id}`, updates)
  return data
}

export const deleteExpense = async (id) => {
  const { data } = await client.delete(`/expenses/${id}`)
  return data
}

// Made with Bob
