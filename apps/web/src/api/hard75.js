import client from './client'

export const getToday = async () => {
  const { data } = await client.get('/hard75/today')
  return data
}

export const toggleHabit = async (field) => {
  const { data } = await client.patch('/hard75/today', { field })
  return data
}

export const getStreak = async () => {
  const { data } = await client.get('/hard75/streak')
  return data
}

export const getHistory = async () => {
  const { data } = await client.get('/hard75/history')
  return data
}