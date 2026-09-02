#!/bin/sh
PORT="${PORT:-43123}"
wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1
