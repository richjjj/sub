export const config = { runtime: 'edge' };

import worker from '../_worker.js';

function createKVClient() {
  const baseUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  const hasRemote = !!(baseUrl && token);

  const memoryStore = new Map();

  async function remoteGet(key) {
    // Try path style first
    const pathUrl = `${baseUrl.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`;
    let res = await fetch(pathUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && typeof data.result !== 'undefined') return data.result;
      if (data && typeof data.value !== 'undefined') return data.value;
      // Some KV providers return the value as plain text
      try { return await res.text(); } catch {}
    }

    // Fallback to POST command style
    res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["GET", key])
    });
    if (!res.ok) return null;
    const { result } = await res.json().catch(() => ({ result: null }));
    return result ?? null;
  }

  async function remoteSet(key, value, opts) {
    // Prefer path style
    const pathUrl = `${baseUrl.replace(/\/$/, '')}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
    let res = await fetch(pathUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      // Fallback to POST style
      res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["SET", key, value])
      });
    }
    // TTL support via expirationTtl (seconds)
    if (opts && opts.expirationTtl) {
      const ttlMs = opts.expirationTtl * 1000;
      const exUrl = `${baseUrl.replace(/\/$/, '')}/pexpire/${encodeURIComponent(key)}/${ttlMs}`;
      await fetch(exUrl, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  }

  async function remoteDel(key) {
    const pathUrl = `${baseUrl.replace(/\/$/, '')}/del/${encodeURIComponent(key)}`;
    let res = await fetch(pathUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(["DEL", key])
      }).catch(() => {});
    }
  }

  async function remoteKeys(pattern) {
    // Try path style keys endpoint
    const url = `${baseUrl.replace(/\/$/, '')}/keys/${encodeURIComponent(pattern)}`;
    let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      try {
        const data = await res.json();
        if (Array.isArray(data.result)) return data.result;
        if (Array.isArray(data)) return data; // some providers return array directly
      } catch {}
    }

    // Fallback to POST style
    res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(["KEYS", pattern])
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.result)) return data.result;
    }
    return [];
  }

  return {
    hasRemote,
    async get(key) {
      if (hasRemote) return await remoteGet(key);
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    async set(key, value, opts) {
      if (hasRemote) return await remoteSet(key, value, opts);
      memoryStore.set(key, value);
    },
    async del(key) {
      if (hasRemote) return await remoteDel(key);
      memoryStore.delete(key);
    },
    async keysByPrefix(prefix) {
      if (hasRemote) return await remoteKeys(`${prefix}*`);
      return Array.from(memoryStore.keys()).filter(k => k.startsWith(prefix));
    }
  };
}

function makeKVNamespace(nsName, client) {
  // List indexes to emulate Cloudflare KV list when remote provider lacks KEYS.
  const indexSets = {
    'SUBLINK_KV:nodes-': 'index:SUBLINK_KV:nodes',
    'SUBLINK_KV:fixed-sub-': 'index:SUBLINK_KV:fixed_sub',
    'TEMPLATE_CONFIG:template-': 'index:TEMPLATE_CONFIG:template'
  };

  function indexKeyFor(prefix) {
    const key = `${nsName}:${prefix}`;
    return indexSets[key] || null;
  }

  async function addToIndex(prefix, keyName) {
    const idx = indexKeyFor(prefix);
    if (!idx) return;
    // store as a Redis Set via SADD; if not available, store a simple JSON array under the index key
    const raw = await client.get(idx);
    let set = new Set();
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach(v => set.add(v));
      } catch {}
    }
    set.add(keyName);
    await client.set(idx, JSON.stringify(Array.from(set)));
  }

  async function removeFromIndex(prefix, keyName) {
    const idx = indexKeyFor(prefix);
    if (!idx) return;
    const raw = await client.get(idx);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      const set = new Set(arr);
      set.delete(keyName);
      await client.set(idx, JSON.stringify(Array.from(set)));
    } catch {}
  }

  return {
    async get(key) {
      return await client.get(`${key}`);
    },
    async put(key, value, opts) {
      await client.set(`${key}`, value, opts);
      // maintain simple indexes for list()
      if (key.startsWith('nodes-')) await addToIndex('nodes-', key);
      if (key.startsWith('fixed-sub-')) await addToIndex('fixed-sub-', key);
      if (key.startsWith('template-') && nsName === 'TEMPLATE_CONFIG') await addToIndex('template-', key);
    },
    async delete(key) {
      await client.del(`${key}`);
      if (key.startsWith('nodes-')) await removeFromIndex('nodes-', key);
      if (key.startsWith('fixed-sub-')) await removeFromIndex('fixed-sub-', key);
      if (key.startsWith('template-') && nsName === 'TEMPLATE_CONFIG') await removeFromIndex('template-', key);
    },
    async list({ prefix } = {}) {
      // Try remote KEYS first
      const keys = await client.keysByPrefix(prefix || '');

      let names = keys;
      if (!keys || keys.length === 0) {
        // fallback to index store
        const idx = indexKeyFor(prefix || '');
        if (idx) {
          const raw = await client.get(idx);
          if (raw) {
            try {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) names = arr;
            } catch {}
          }
        }
      }

      const unique = Array.from(new Set(names || []));
      return {
        keys: unique.map(name => ({ name })),
        list_complete: true
      };
    }
  };
}

function createEnv() {
  const client = createKVClient();
  return {
    ACCESS_PASSWORD: process.env.ACCESS_PASSWORD,
    SUBLINK_KV: makeKVNamespace('SUBLINK_KV', client),
    TEMPLATE_CONFIG: makeKVNamespace('TEMPLATE_CONFIG', client)
  };
}

export default async function handler(request) {
  const env = createEnv();
  const ctx = { waitUntil: (p) => p }; // minimal stub
  try {
    return await worker.fetch(request, env, ctx);
  } catch (e) {
    return new Response('Internal Error: ' + (e && e.message ? e.message : String(e)), { status: 500 });
  }
}
