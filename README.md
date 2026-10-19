# Session Booking API

REST API where teachers publish sessions, users book them, and completed sessions show up in the user's history.

**Stack:** Node.js, TypeScript, Express 5, MongoDB, Mongoose, Zod (request validation).

## Setup
Requires Node 18+ and a running MongoDB (local, or `docker run -d -p 27017:27017 mongo:7`).

```bash
npm install
cp .env.example .env      # edit MONGODB_URI / PORT if needed
npm run dev               # development, auto-reload
# or
npm run build && npm start
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | _(required)_ | Mongo connection string |
| `NODE_ENV` | `development` | In `production`, 500 responses hide error details |

## Testing with Postman
Import `postman/session-booking-api.postman_collection.json`. Run the requests top to bottom: the collection saves `userId`, `teacherId` and `sessionId` automatically, so each request uses the ids created by the earlier ones.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/users` | Create user (`fullName`, `email`, `phone`). Email is unique. |
| POST | `/teachers` | Helper endpoint so sessions can be created (not part of the brief). |
| POST | `/sessions` | Create an `AVAILABLE` session (`teacherId`, `startTime`, `endTime`). |
| GET | `/sessions/available?dateTimestamp=` | Available sessions on that date. **Aggregation pipeline.** |
| POST | `/sessions/:id/book` | Book a session. Body: `{ "userId": "..." }`. |
| PATCH | `/sessions/:id/complete` | Mark a `BOOKED` session `COMPLETED`. |
| GET | `/users/:id/sessions` | `{ upcomingSessions, completedSessions }`. **Aggregation pipeline.** |
| GET | `/health` | Liveness check. |

### Status codes
`201` created, `200` ok, `400` validation error (bad ObjectId, bad body, `endTime <= startTime`), `404` user / teacher / session not found, `409` conflict (duplicate email, session not bookable, session not completable, overlapping session), `500` unexpected error.
Every error returns `{ "success": false, "message": "...", "details": ... }`.

## Design decisions
- **Layers:** routes → controllers (HTTP only) → services (business rules) → models. Errors are thrown as `AppError` and handled in one place (`middlewares/errorHandler.ts`). Express 5 forwards async errors itself, so handlers are plain `async/await`.
- **No double booking:** booking and completing use a single conditional `findOneAndUpdate` (`{ _id, status: AVAILABLE }`), so two simultaneous requests cannot both succeed. A follow-up lookup only decides between 404 and 409 when the update matched nothing.
- **`dateTimestamp`:** epoch milliseconds (epoch seconds also accepted). It selects the **UTC calendar day** containing that instant, and sessions whose `startTime` falls in that day are returned.
- **"Upcoming" vs "Completed":** upcoming = `BOOKED` sessions (soonest first); completed = `COMPLETED` sessions (most recent first). Upcoming is based on status, not on the clock, so a booked session whose time has passed stays upcoming until someone marks it complete.
- **Overlap guard:** a teacher cannot have two overlapping sessions (409). This is an addition beyond the brief.
- **Indexes:** `{status, startTime}` for the availability query, `{userId, status}` for the history query, unique `email` on users.
