#!/bin/bash
# Express (Node) now spawns the Python API internally as a child process.
# No need to start Python separately here.
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
