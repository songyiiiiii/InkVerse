const BASE = '';

function getToken() {
  return localStorage.getItem('inkverse_token') || '';
}

function headers(isJson = true) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
}

export const api = {
  get: (url) => fetch(BASE + url, { headers: headers(false) }).then(r => r.json()),
  post: (url, body) => fetch(BASE + url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),
  put: (url, body) => fetch(BASE + url, { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),
  del: (url) => fetch(BASE + url, { method: 'DELETE', headers: headers(false) }).then(r => r.json()),
  getRaw: (url, opts = {}) => fetch(BASE + url, { ...opts, headers: { ...headers(true), ...(opts.headers || {}) } }),
};
