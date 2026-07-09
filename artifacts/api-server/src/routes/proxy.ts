/**
 * Proxy routes that forward /api/admin/* and /api/football/*
 * to the Python FastAPI backend running at localhost:5000.
 *
 * The Express router is mounted at /api, so incoming paths here
 * are already stripped of the /api prefix (e.g. /admin/auth/login).
 */
import { Router } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

const router = Router();

const PYTHON_API = "http://localhost:5000";

const proxyOpts = {
  target: PYTHON_API,
  changeOrigin: true,
  on: {
    // express.json() upstream already consumed the request stream, so we
    // must re-serialize req.body and write it out ourselves, or POST/PATCH
    // requests hang forever waiting for a body that will never arrive.
    proxyReq: fixRequestBody,
    error: (err: Error, _req: any, res: any) => {
      console.error("[proxy] Python API unreachable:", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "Football AI API is starting up. Please retry in a moment." });
      }
    },
  },
};

// /api/admin/* → http://localhost:5000/admin/*
// Express strips the "/admin" mount prefix before the middleware sees the
// request, so we must add it back via pathRewrite or Python receives paths
// like "/auth/login" instead of "/admin/auth/login".
router.use(
  "/admin",
  createProxyMiddleware({ ...proxyOpts, pathRewrite: (path) => `/admin${path}` }),
);

// /api/football/* → http://localhost:5000/football/*
router.use(
  "/football",
  createProxyMiddleware({ ...proxyOpts, pathRewrite: (path) => `/football${path}` }),
);

export default router;
