import { getErrorMessage } from '#/utils/get-error-message'
import axios from 'axios'

const BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = getErrorMessage(err) || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)
