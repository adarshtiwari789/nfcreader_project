const BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://nfc-backend-bswp.onrender.com/api'
);

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include', // Send HTTP-only auth cookies on every request
    headers,
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    error.errors = data.errors || [];
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Cards & Enrollment
  getEnrollmentToken: () => request('/cards/enrollment-token'),
  enrollCard: (body) => request('/cards/enroll', { method: 'POST', body: JSON.stringify(body) }),
  getMyCard: () => request('/cards/my-card'),
  scanCard: (body) => request('/cards/scan', { method: 'POST', body: JSON.stringify(body) }),
  getCards: () => request('/cards'),
  getCardByUid: (uid) => request(`/cards/${uid}`),
  updateBalance: (uid, body) => request(`/cards/${uid}/balance`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Payments & Transactions
  payWithCard: (payload) =>
    request('/cards/pay', {
      method: 'POST',
      headers: payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {},
      body: JSON.stringify(payload),
    }),
  getMyTransactions: () => request('/cards/transactions'),
};
