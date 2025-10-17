import worker from '../_worker.js';

// Vercel adapter for Cloudflare Workers
export default async function handler(req, res) {
  try {
    // Create a Request object that mimics Cloudflare Workers Request
    const url = new URL(req.url, `http://${req.headers.host}`);

    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    // Create a simple environment object with KV storage simulation
    // For production, you'll need to configure Vercel KV or another storage solution
    const env = {
      SUBLINK_KV: process.env.KV_REST_API_URL ? {
        async get(key) {
          // Vercel KV implementation
          const { kv } = await import('@vercel/kv');
          return await kv.get(key);
        },
        async put(key, value, options) {
          const { kv } = await import('@vercel/kv');
          if (options?.expirationTtl) {
            return await kv.setex(key, options.expirationTtl, value);
          }
          return await kv.set(key, value);
        },
        async delete(key) {
          const { kv } = await import('@vercel/kv');
          return await kv.del(key);
        },
        async list(options) {
          const { kv } = await import('@vercel/kv');
          const keys = await kv.keys(options?.prefix + '*');
          return {
            keys: keys.map(name => ({ name }))
          };
        }
      } : createLocalStorage()
    };

    // Call the worker
    const response = await worker.fetch(request, env, {});

    // Convert Cloudflare Workers Response to Node.js response
    const body = await response.text();

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);
    res.send(body);
  } catch (error) {
    console.error('Vercel adapter error:', error);
    res.status(500).send('Internal Server Error');
  }
}

// Fallback to memory storage for development
function createLocalStorage() {
  const storage = {};

  return {
    async get(key) {
      return storage[key] || null;
    },
    async put(key, value, options) {
      storage[key] = value;
      if (options?.expirationTtl) {
        setTimeout(() => {
          delete storage[key];
        }, options.expirationTtl * 1000);
      }
    },
    async delete(key) {
      delete storage[key];
    },
    async list(options) {
      const prefix = options?.prefix || '';
      const keys = Object.keys(storage).filter(key => key.startsWith(prefix));
      return {
        keys: keys.map(name => ({ name }))
      };
    }
  };
}