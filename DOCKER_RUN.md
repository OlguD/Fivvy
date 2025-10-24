Docker (production) — build & run

This project includes Dockerfiles for the backend and frontend and a `docker-compose.yml` at the repository root to run the app in production mode.

Steps (macOS):

1. Build and start the services

```bash
cd /path/to/Fivvy
docker compose build
docker compose up -d
```

2. Check logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

3. Services

- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000
NOTE: If port 80 on your host is already in use, the compose file maps the frontend nginx to port 8080.
 - Frontend (nginx): http://localhost:8080
 - Backend API: http://localhost:5000

Notes & environment overrides

- The backend uses a SQLite DB; a named volume `fivvy_db` is created and mounted at `/data` inside the container. The container's connection string is set to `Data Source=/data/fivvy.db` via compose.
- For production you should override sensitive values (JWT secret, issuer, etc.) via environment variables or a secret manager. For example:

```yaml
services:
  backend:
    environment:
      - JwtSettings__Secret=${JWT_SECRET}
```

- If you want the frontend to use a different base URL for CORS, set `FrontendBaseUrl` in `backend/Fivvy.Api/appsettings.json` or override via environment var `FrontendBaseUrl`.