import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST interceptor — attach token to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('supro_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE interceptor — handle expired/invalid tokens globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem('supro_token')
      localStorage.removeItem('supro_user')
      window.location.href = '/login'
    }
    // Pass the server's error message to the component
    return Promise.reject(
      new Error(err.response?.data?.error || 'Something went wrong.')
    )
  }
)


export default client