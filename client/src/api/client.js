const API_URL = 'http://localhost:3001/api'

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}

export default api
