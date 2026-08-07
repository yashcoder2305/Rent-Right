const BASE = '/api';

function getToken() {
  return localStorage.getItem('rentright_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('rentright_token', token);
  else localStorage.removeItem('rentright_token');
}

export function getUser() {
  const raw = localStorage.getItem('rentright_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  if (user) localStorage.setItem('rentright_user', JSON.stringify(user));
  else localStorage.removeItem('rentright_user');
}

async function request(path, { method = 'GET', body, isForm = false, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (raw) {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.blob();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  jurisdictions: () => request('/jurisdictions'),
  analyze: (formData) => request('/analyze', { method: 'POST', body: formData, isForm: true }),
  leases: () => request('/dashboard/leases'),
  lease: (id) => request(`/dashboard/leases/${id}`),
  setViolationStatus: (id, status) => request(`/dashboard/violations/${id}/status`, { method: 'PATCH', body: { status } }),
  letters: () => request('/dashboard/letters'),
  generateLetter: (payload) => request('/letter', { method: 'POST', body: payload, raw: true }),
  compare: (lease_id_old, lease_id_new) => request('/compare', { method: 'POST', body: { lease_id_old, lease_id_new } }),
  // Landlord-only
  generateDraft: (lease_id) => request('/landlord/draft', { method: 'POST', body: { lease_id }, raw: true }),
  getDraft: (lease_id) => request(`/landlord/draft/${lease_id}`),
};

