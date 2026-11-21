# ILY

ILY is a webcam game for practicing American Sign Language. Start with the letters of
a loved one's name, then learn the first words. The browser runs recognition and
coaching. The server stores the account and learning progress.

## Run locally

With Docker Compose running, create a local password on the first run:

```sh
if [ ! -f .env ]; then
  (umask 077 && printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)" > .env)
fi
docker compose up --build -d --wait
```

Open [ILY](http://localhost:5173), choose **Get started**, complete onboarding, and
register with an email and password. The registration link on the login screen also
starts with onboarding. Returning users can log in and resume from **Your
lessons**. If the previous version ran on the same origin, registration imports that
browser's existing lesson data once into the new account.

The web service binds to localhost. `APP_PORT` defaults to 5173. Set it in `.env`
if another process already uses that port.
For a deployment behind HTTPS, set `SESSION_SECURE=true` for Secure cookies.
The PostgreSQL password is read when the database volume is initialized.
`docker compose down` stops the stack and keeps the PostgreSQL volume.

## Architecture

- `frontend/` is the existing Vite/React app. Nginx serves it and proxies `/api/`.
  MediaPipe runs in the browser and webcam frames stay on the device.
- `backend/` exposes the Node.js API. Passwords use salted scrypt hashes, and opaque
  session tokens live in HTTP-only cookies. The server stores hashes of the tokens.
- PostgreSQL keeps account state, including onboarding, the name, active lesson,
  position, retries, misses, stars, and each lesson's completion status. Revising an
  older copy returns a conflict so one tab cannot silently overwrite another.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check database connectivity |
| POST | `/api/signup` | Register with email, password and initial state |
| POST | `/api/login` | Start a session and load account state |
| POST | `/api/logout` | End the session |
| GET | `/api/account` | Get the signed-in account's state and revision |
| PUT | `/api/account` | Save the signed-in account's state with the current revision |

The project plan and roles are in [PLAN.md](PLAN.md), the product background and cost
assumptions are in [CLAUDE.md](CLAUDE.md), and the demo funnel is in
[USER-JOURNEY.md](USER-JOURNEY.md).

## Check the API

Against a local test stack, run:

```sh
APP_PORT=8089 docker compose -p ily-test up --build -d --wait
ILY_TEST_URL=http://localhost:8089 node --test backend/test/account.test.js
docker compose -p ily-test down -v
```

The test creates synthetic accounts in the isolated test database.
