---
name: Express proxy fronting a Python backend
description: Pitfalls when an Express service (http-proxy-middleware) proxies to a separate Python/FastAPI backend, plus the auth pattern used to avoid CSRF.
---

## Body-parser + proxy ordering
If `express.json()`/`express.urlencoded()` run before the proxy middleware, they consume the request stream, so `http-proxy-middleware` has nothing left to forward — POST/PATCH/PUT requests hang forever waiting for a body that never arrives (GETs work fine, masking the issue).

**Why:** discovered when admin login POSTs through an Express→FastAPI proxy hung indefinitely with no error.

**How to apply:** when body-parsing middleware is mounted globally ahead of a proxy route, add `on: { proxyReq: fixRequestBody }` (from `http-proxy-middleware`) to the proxy options so the already-parsed `req.body` gets re-serialized onto the proxied request.

## Router mount prefix stripping
Express strips the mount prefix (e.g. `/admin`, `/football`) before proxy middleware sees `req.path`. If the backend expects the full path, use `pathRewrite` to re-add the prefix, or the backend will 404 everything.

## Bearer-only auth avoids needing real CSRF protection
For a cookie+SPA admin panel talking through a proxy to a separate backend, prefer: access token as `Authorization: Bearer` header only (never accepted from cookies for authorizing actions), refresh token in an httpOnly cookie used only by `/refresh`. This is inherently CSRF-safe since a cross-origin page can't set custom headers — no need for a separate CSRF token/cookie scheme, which is easy to leave inert (generated but never validated) if you're not careful.

**Why:** a code review caught a CSRF token being issued but never validated server-side, while the frontend also sent Bearer tokens the backend didn't actually check — dual mechanisms that individually did nothing.

## bcrypt vs passlib on Python 3.13
`passlib[bcrypt]` breaks on Python 3.13 + bcrypt 4.x (hard runtime error on startup). Use the `bcrypt` package directly for hashing/verification instead.
