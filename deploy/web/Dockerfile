# syntax=docker/dockerfile:1
#
# Builds one of the workspace frontends and serves it with nginx.
#
#   docker build -f deploy/web/Dockerfile --build-arg APP=predictor-web .
#   docker build -f deploy/web/Dockerfile --build-arg APP=admin-web .
#
# The build context must be the repository root: the frontends depend on the
# pnpm workspace (lib/, the root lockfile), which is not available from inside
# an app directory.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build

ARG APP=predictor-web
ENV PNPM_HOME=/pnpm \
    CI=true
ENV PATH=$PNPM_HOME:$PATH

# The version the lockfile was produced with. Pinned so a new pnpm release
# cannot reinterpret the lockfile mid-deploy.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /repo

# Fetch dependencies from the lockfile alone, so this layer is reused until
# the lockfile itself changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile \
 && pnpm --filter "@workspace/${APP}" run build \
 && test -f "artifacts/${APP}/dist/public/index.html"

# ── serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

ARG APP=predictor-web

COPY --from=build /repo/artifacts/${APP}/dist/public /usr/share/nginx/html
COPY deploy/web/nginx.conf.template /etc/nginx/custom/default.conf.template
COPY deploy/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && rm -f /etc/nginx/conf.d/default.conf

# Render sets PORT; 10000 is its default. API_UPSTREAM has no default on
# purpose: the container refuses to start without it rather than proxying
# somewhere wrong.
ENV PORT=10000

EXPOSE 10000
CMD ["/entrypoint.sh"]
