if [[ "$1" == "backend" ]]; then
    cd /homesite/backend
    bun run serve
fi

if [[ "$1" == "frontend" ]]; then
    cd /homesite/frontend
    bun run start --port 8001
fi

if [[ "$1" == "db" ]]; then
    if [[ "$SURREAL_USERNAME" == "" ]]; then
        exit 1
    fi
    if [[ "$SURREAL_PASSWORD" == "" ]]; then
        exit 1
    fi
    surreal start -u "$SURREAL_USERNAME" -p "$SURREAL_PASSWORD" --auth file:homesite.db
fi