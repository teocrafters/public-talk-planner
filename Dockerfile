# syntax=docker/dockerfile:1

# Kept identical to .nvmrc and to the version CI resolves from it.
ARG NODE_VERSION=26.6.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

# Node's bundled corepack is deprecated, so install it explicitly; it is what keeps the
# packageManager field in package.json the single source of the pnpm version.
RUN npm install --global corepack@latest && corepack enable pnpm

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Nitro traces only the files the server entry reaches, so the migrator is absent from the
# traced copy of drizzle-orm. The package has no runtime dependencies, so overlaying it whole
# is enough to make the migrator importable at boot.
RUN cp -RL node_modules/drizzle-orm/. .output/server/node_modules/drizzle-orm/

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# The Swarm health check runs curl from inside the container.
RUN apk add --no-cache curl

# .output is self-contained: Nitro traces every external into .output/server/node_modules.
COPY --from=build /app/.output ./.output

# Both land inside .output/server because that is the only directory from which Node resolves
# drizzle-orm and pg.
COPY --from=build /app/server/database/migrations ./.output/server/migrations
COPY --from=build /app/docker/migrate.mjs ./.output/server/migrate.mjs

# The default jobFilesDir resolves against /app, which the unprivileged user cannot create in.
RUN mkdir -p /app/.data/job-files && chown -R node:node /app/.data
VOLUME ["/app/.data/job-files"]

USER node
EXPOSE 3000

# Migrations run to completion before the server binds, which is safe only because the
# deployment is single-replica.
CMD ["sh", "-c", "node .output/server/migrate.mjs && exec node .output/server/index.mjs"]
