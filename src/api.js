const BASE_URL = 'http://localhost:5000/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include', // Send HTTP-only cookies automatically
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed')
    error.status = res.status
    error.errors = data.errors || []
    throw error
  }

  return data
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => request('/auth/logout',   { method: 'POST' }),
  getMe:    ()     => request('/auth/me'),

  // Cards & Enrollment
  getEnrollmentToken: () => request('/cards/enrollment-token'),
  enrollCard:         (body) => request('/cards/enroll', { method: 'POST', body: JSON.stringify(body) }),
  getMyCard:          () => request('/cards/my-card'),
  scanCard:           (body) => request('/cards/scan', { method: 'POST', body: JSON.stringify(body) }),
  getCards:           ()     => request('/cards'),
  getCardByUid:       (uid)  => request(`/cards/${uid}`),
  updateBalance:      (uid, body) => request(`/cards/${uid}/balance`, { method: 'PATCH', body: JSON.stringify(body) }),
}
