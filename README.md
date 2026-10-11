# Chulo

A web platform for restaurant recommendations and delivery management.

## Requirements

- Go 1.25 or newer
- Node.js 20.19+ (or 22.12+) and npm
- Docker Compose (optional, for running the full stack in containers)

## Local development

1. Copy `.env.example` to `.env` and update the database credentials and JWT
   secret.
2. Start PostgreSQL, for example with `docker compose up -d db`.
3. Start the API from the repository root:

   ```sh
   cd backend
   go run .
   ```

   The API listens on port 8080 by default. `GET http://localhost:8080/api`
   returns a JSON welcome message.
4. In a second terminal, start the frontend:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

   Open <http://localhost:3000>. Requests under `/api` are proxied to the
   local API. Vite uses the same host port as the Docker frontend, so stop the
   Compose frontend before starting Vite, or stop Vite before starting the
   Compose frontend.

## Run with Docker Compose

Copy `.env.example` to `.env`, replace the placeholder secrets, then run:

```sh
docker compose up --build
```

The frontend is available at <http://localhost:3000>, the API at
<http://localhost:8080/api>, and PostgreSQL at `localhost:5432`.

## Frontend scripts

Run these commands from `frontend/`:

```sh
npm run dev      # Start the Vite development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

Tailwind CSS is integrated through its Vite plugin; use Tailwind utility classes
directly in React components.
