import client from './client'

export const getGoals = async () => {
  const { data } = await client.get('/goals')
  return data
}

export const createGoal = async (goal) => {
  const { data } = await client.post('/goals', goal)
  return data
}

export const updateGoal = async (id, updates) => {
  const { data } = await client.put(`/goals/${id}`, updates)
  return data
}

export const updateGoalProgress = async (id, progress) => {
  const { data } = await client.patch(`/goals/${id}/progress`, { progress })
  return data
}

export const deleteGoal = async (id) => {
  const { data } = await client.delete(`/goals/${id}`)
  return data
}