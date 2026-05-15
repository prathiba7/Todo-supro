import client from './client'

export const getTasks = async (date) => {
  const { data } = await client.get('/tasks', {
    params: date ? { date } : {},
  })
  return data
}

export const createTask = async (task) => {
  const { data } = await client.post('/tasks', task)
  return data
}

export const updateTask = async (id, updates) => {
  const { data } = await client.put(`/tasks/${id}`, updates)
  return data
}

export const toggleTask = async (id) => {
  const { data } = await client.patch(`/tasks/${id}/toggle`)
  return data
}

export const deleteTask = async (id) => {
  const { data } = await client.delete(`/tasks/${id}`)
  return data
}