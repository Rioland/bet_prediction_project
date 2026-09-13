#!/bin/sh
set -eu

: "${PORT:=10000}"
: "${API_UPSTREAM:?API_UPSTREAM must be set to the API origin, e.g. https://bet-prediction-api.onrender.com}"

# Scheme and host only; a trailing slash would double up in the proxied path.
API_UPSTREAM="${API_UPSTREAM%/}"
case "$API_UPSTREAM" in
  http://*|https://*) ;;
  *) echo "API_UPSTREAM must start with http:// or https:// (got: $API_UPSTREAM)" >&2; exit 1 ;;
esac

# nginx needs an explicit resolver to re-resolve a variable upstream. Use the
# container's own nameserver; IPv6 addresses must be bracketed.
RESOLVER="$(awk '/^nameserver/ { ip = $2; if (ip ~ /:/) ip = "[" ip "]"; print ip; exit }' /etc/resolv.conf || true)"
: "${RESOLVER:=1.1.1.1}"

export PORT API_UPSTREAM RESOLVER

envsubst '${PORT} ${API_UPSTREAM} ${RESOLVER}' \
  < /etc/nginx/custom/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "serving on :$PORT, proxying /api to $API_UPSTREAM (resolver $RESOLVER)"
nginx -t
exec nginx -g 'daemon off;'
