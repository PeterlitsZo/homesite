FROM oven/bun:1 as base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev/frontend/
COPY frontend/package.json frontend/bun.lockb /temp/dev/frontend/
RUN cd /temp/dev/frontend && bun install --frozen-lockfile

RUN mkdir -p /temp/dev/backend/
COPY backend/package.json backend/bun.lockb /temp/dev/backend/
RUN cd /temp/dev/backend && bun install --frozen-lockfile

RUN mkdir -p /temp/prod/frontend/
COPY frontend/package.json frontend/bun.lockb /temp/prod/frontend/
RUN cd /temp/prod/frontend && bun install --frozen-lockfile --production

RUN mkdir -p /temp/prod/backend/
COPY backend/package.json backend/bun.lockb /temp/prod/backend/
RUN cd /temp/prod/backend && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/dev/frontend/node_modules frontend/node_modules
COPY ./frontend ./frontend
COPY --from=install /temp/dev/backend/node_modules backend/node_modules
COPY ./backend ./backend

ENV NODE_ENV=production
RUN cd ./frontend && bun run build

FROM base AS release
COPY --from=install /temp/prod/frontend/node_modules frontend/node_modules
COPY --from=install /temp/prod/backend/node_modules backend/node_modules
COPY --from=prerelease /usr/src/app/frontend/ ./frontend/
COPY --from=prerelease /usr/src/app/backend/ ./backend/
COPY ./docker.entry.ts .

USER bun
EXPOSE 8000/tcp
ENTRYPOINT [ "bun", "run", "docker.entry.ts" ]

