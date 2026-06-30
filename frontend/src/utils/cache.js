const store = {};

export const getCache = (key) => {
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    delete store[key];
    return null;
  }
  return entry.data;
};

export const setCache = (key, data, ttlMs = 5 * 60 * 1000) => {
  store[key] = { data, expiry: Date.now() + ttlMs };
};