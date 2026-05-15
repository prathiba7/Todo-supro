// apps/web/src/api/auth.js
import client from './client'

export const login = async (email, password) => {
  const { data } = await client.post('/auth/login', { email, password })
  return data // { token, user: { id, name, email } }
}

export const register = async (name, email, password) => {
  const { data } = await client.post('/auth/register', { name, email, password })
  return data // { token, user: { id, name, email } }
}