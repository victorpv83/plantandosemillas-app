/**
 * Cloudflare Worker Entrypoint para Plantando Semillas STEAM - Retos
 * Compatible con Cloudflare D1 (SQLite) y Workers Static Assets.
 */

// Ambient Cloudflare types fallback when @cloudflare/workers-types is not installed
type D1DatabaseBinding = any;
type FetcherBinding = any;

export interface Env {
  DB: D1DatabaseBinding;
  ASSETS?: FetcherBinding;
  APP_NAME?: string;
  ENVIRONMENT?: string;
}

// Web Crypto SHA-512 with salt implementation for Cloudflare Workers
async function hashSecretWorker(secret: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret.trim()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-512',
    },
    keyMaterial,
    512
  );
  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(salt),
  };
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Router
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname.replace('/api', '');

      // Health / Status
      if (path === '/status' || path === '/health') {
        return jsonResponse({
          status: 'ok',
          environment: env.ENVIRONMENT || 'production',
          app: 'Plantando Semillas STEAM – Retos',
        });
      }

      // Public Challenges
      if (path === '/challenges' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, title, description, type, category, difficulty, points, estimated_time_min, is_published, grid_size, symbols_theme, clues_json, created_at, updated_at FROM challenges WHERE is_published = 1 ORDER BY grid_size ASC, points ASC'
        ).all();

        const formatted = (results || []).map((c: any) => ({
          ...c,
          is_published: Boolean(c.is_published),
          clues_grid: JSON.parse(c.clues_json),
        }));

        return jsonResponse(formatted);
      }

      // Student Login
      if (path === '/auth/student-login' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const alias = String(body.alias || '').trim();
        const code = String(body.code || '').trim().toUpperCase();

        if (!alias || !code) {
          return jsonResponse({ error: 'Introduce tu alias y tu código personal.' }, 400);
        }

        const user = (await env.DB.prepare(
          "SELECT * FROM users WHERE LOWER(alias) = LOWER(?) AND role = 'student'"
        )
          .bind(alias)
          .first()) as any;

        if (!user) {
          return jsonResponse({ error: 'No se encontró ningún alumno con ese alias.' }, 401);
        }

        if (user.is_active !== 1) {
          return jsonResponse({ error: 'Cuenta de alumno desactivada.' }, 403);
        }

        const check = await hashSecretWorker(code, user.salt);
        if (check.hash !== user.code_hash) {
          return jsonResponse({ error: 'El código personal no es correcto.' }, 401);
        }

        const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await env.DB.prepare(
          "INSERT INTO sessions (token, user_id, role, expires_at, created_at) VALUES (?, ?, 'student', ?, datetime('now'))"
        )
          .bind(token, user.id, expiresAt)
          .run();

        return jsonResponse(
          {
            user: {
              id: user.id,
              role: 'student',
              alias: user.alias,
              display_name: user.display_name,
              total_points: user.total_points,
              current_level: user.current_level,
              is_active: true,
            },
            token,
          },
          200,
          {
            'Set-Cookie': `steam_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure`,
          }
        );
      }

      // Default API 404
      return jsonResponse({ error: 'Endpoint no encontrado en Cloudflare Workers.' }, 404);
    }

    // Serve Static Assets from Cloudflare Pages or Workers Static Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Plantando Semillas STEAM - Frontend en ejecución', { status: 200 });
  },
};
