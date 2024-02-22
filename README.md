# Homesite

## Build and Run

1. Get the bun.
2. `cd frontend` and then:
    1. `bun i && bun run build` to build the frontend part.
    2. `nohup bun run start --port 3001 > bun.log 2>&1 &` to start the frontend
    server.
3. `cd backend` and then:
    1. `cp .env.example .env` and edit it.
    2. `bun i`.
    3. `./ctl.ts dev run-postgres-in-docker` to run the database.
    4. `./ctl.ts dev deploy-db-migrate` to apply those database migrations.
    5. `nohup bun run serve > bun.log 2>&1 &` to start the backend server.

Then you need a proxy to serve the static files (built from frontend) and the
backend. Here is an example of Caddyfile:

```caddy
homesite.peterlits.com {
    handle /api/v1/* {
        reverse_proxy localhost:3000
    }

    handle {
        reverse_proxy localhost:3001
    }
}
```
