#!/usr/bin/env bash

if [[ "$1" == "backend" ]]; then
    cd /homesite/backend
    export PATH=/root/.bun/bin:$PATH

    exec bun run serve
fi

if [[ "$1" == "frontend" ]]; then
    cd /homesite/frontend
    export PATH=/root/.bun/bin:$PATH

    exec bun run start --port 8001
fi

if [[ "$1" == "db" ]]; then
    cd /homesite/
    source /homesite/backend/.env

    if [[ "$SURREAL_USERNAME" == "" ]]; then
        exit 1
    fi
    if [[ "$SURREAL_PASSWORD" == "" ]]; then
        exit 1
    fi
    if [[ "$SURREAL_PORT" == "" ]]; then
        exit 1
    fi
    exec surreal start -u "$SURREAL_USERNAME" -p "$SURREAL_PASSWORD" --auth --bind "0.0.0.0:${SURREAL_PORT}" file:homesite.db
fi

if [[ "$1" == "caddy" ]]; then
    caddy run --config /homesite/Caddyfile
fi

if [[ "$1" == "entry" ]]; then
    # Init the folder to place logs.
    mkdir -p /homesite/log/

    # Make sure the configs exists.
    if [[ ! -d /homesite/configs ]]; then
        echo "Cannot find /homesite/configs"
        exit 1
    fi

    cp /homesite/configs/backend/.env.production /homesite/backend/.env
    cp /homesite/configs/frontend/.env.production /homesite/frontend/.env

    exec /usr/bin/supervisord
fi
