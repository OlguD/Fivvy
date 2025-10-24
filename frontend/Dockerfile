### Stage 1: build the Angular app
### Stage 1: build the Angular app (Debian-based Node for broader native build support)
FROM node:lts-jod AS build
WORKDIR /app

# Ensure minimal build tools available for packages that require compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
		python3 \
		make \
		g++ \
		git \
		ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# copy package manifests and install deps
# Copy package manifests and set PATH (use key=value form to avoid legacy format warning)
COPY package*.json ./
ENV PATH=/app/node_modules/.bin:$PATH
# Use npm install with flags to avoid CI lockfile/peer-dep issues inside container
RUN npm install --no-audit --no-fund --legacy-peer-deps --unsafe-perm --prefer-offline

# copy source and build
COPY . .
# ensure we build production artifacts
RUN npm run build -- --configuration production

### Stage 2: produce artifact image containing built static files
FROM alpine:3.18 AS artifact
WORKDIR /app
COPY --from=build /app/dist/frontend /app/dist/frontend

CMD ["/bin/sh", "-c", "echo 'frontend build artifact image' && sleep 1d"]
