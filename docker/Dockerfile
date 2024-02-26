FROM oven/bun:1 as base
WORKDIR /usr/src/app


# Install dependencies for frontend and backend.
################################################################################

FROM base AS deps
RUN mkdir -p /temp/dev/frontend/
COPY frontend/package.json frontend/bun.lockb /temp/dev/frontend/
RUN cd /temp/dev/frontend && bun install --frozen-lockfile

RUN mkdir -p /temp/prod/frontend/
COPY frontend/package.json frontend/bun.lockb /temp/prod/frontend/
RUN cd /temp/prod/frontend && bun install --frozen-lockfile --production

RUN mkdir -p /temp/prod/backend/
COPY backend/package.json backend/bun.lockb /temp/prod/backend/
RUN cd /temp/prod/backend && bun install --frozen-lockfile --production

RUN mkdir -p /temp/dev/backend/
COPY backend/package.json backend/bun.lockb /temp/dev/backend/
RUN cd /temp/dev/backend && bun install --frozen-lockfile


# Build.
################################################################################

FROM base AS prerelease
COPY --from=deps /temp/dev/frontend/node_modules frontend/node_modules
COPY ./frontend ./frontend
COPY --from=deps /temp/dev/backend/node_modules backend/node_modules
COPY ./backend ./backend

ENV NODE_ENV=production
RUN cd ./frontend && bun run build


# Declare the runable entrypoints.
################################################################################

FROM debian:12 AS release
WORKDIR /homesite/

# Install tools.
RUN apt update && apt install -y curl unzip supervisor debian-keyring debian-archive-keyring apt-transport-https

# Add gpg.
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

# Add dependencies as runtime: the bun, the database and the caddy LB.
RUN curl -fsSL https://bun.sh/install | bash
RUN curl -sSf https://install.surrealdb.com | sh
RUN apt update && apt install caddy
COPY ./Caddyfile .

# Init the supervisord.
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker.entry.sh .
RUN chmod u+x docker.entry.sh

COPY --from=prerelease /usr/src/app/frontend/ ./frontend/
COPY --from=prerelease /usr/src/app/backend/ ./backend/
COPY --from=deps /temp/prod/frontend/node_modules ./frontend/node_modules
COPY --from=deps /temp/prod/backend/node_modules ./backend/node_modules

EXPOSE 8000/tcp
CMD [ "/homesite/docker.entry.sh", "entry" ]

