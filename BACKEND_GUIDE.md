# BloodPulse backend – setup guide

Zero UI files are modified. The backend lives in new files only:

```
prisma/schema.prisma        database models (SQLite by default, Postgres-ready)
prisma/seed.ts              loads the same demo data as src/lib/mockData.ts
src/server/                 all business logic (no React, no UI imports)
  db.ts crypto.ts auth.ts events.ts http.ts rateLimit.ts validators.ts mappers.ts
  services/ donors.ts requests.ts relay.ts eligibility.ts stats.ts
src/app/api/**/route.ts     thin HTTP endpoints (Next.js route handlers)
src/lib/api-client.ts       OPTIONAL typed client for when you wire the UI
.env.example                config template
```

## Setup (5 steps)
1. Copy these files into the project root (merge folders). Only `package.json` is overwritten (adds deps + db scripts).
2. `npm install`
3. `cp .env.example .env`, then put a key in `PHONE_ENC_KEY`:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. `npm run db:push && npm run db:seed`
5. `npm run dev` and open http://localhost:3000/api/health

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | liveness + DB check |
| GET | /api/hospitals | hospital list |
| GET/POST | /api/donors | list (filters: bloodType,status,city,lat,lng,radiusKm) / register |
| GET/PATCH | /api/donors/:id | profile / update location or phone |
| POST | /api/donors/:id/status | AVAILABLE / STANDBY / OFFLINE (blocked during cooldown) |
| POST | /api/donors/:id/donate | complete donation, start 90-day cooldown |
| GET | /api/donors/:id/alerts | open emergencies dispatched to this donor |
| GET | /api/donors/:id/channels | donor's relay channels |
| GET/POST | /api/requests | list / create emergency (auto-match + live alerts) |
| GET | /api/requests/:id, /matches | request details / ranked matched donors |
| POST | /api/requests/:id/accept | `{donorId, actor}` creates masked relay (first wins) |
| POST | /api/requests/:id/cancel | cancel request |
| GET | /api/matches | match preview without creating a request |
| GET | /api/compatibility | RBC matrix, `?recipient=` or `?donor=` |
| GET/POST | /api/eligibility | cooldown progress / self-screening |
| GET | /api/stats | dashboard counts |
| GET | /api/relay/:id | channel + messages |
| POST | /api/relay/:id/messages | `{sender, text}` (phone numbers/emails auto-redacted) |
| GET | /api/events | Server-Sent Events: `?donorId=` `?requestId=` `?channelId=` |

All responses: `{ success: true, data }` or `{ success: false, error: { code, message } }`.

## Quick test
```bash
curl localhost:3000/api/donors?bloodType=O-
curl -X POST localhost:3000/api/requests -H 'Content-Type: application/json' -d '{
  "patientName":"Test Patient","patientId":"PT-1","recipientBloodType":"B+",
  "hospitalId":"hosp-1","urgency":"IMMEDIATE","unitsRequired":2}'
```

## Security model
- Phone numbers are AES-256-GCM encrypted at rest and never returned.
- Public donor lists round coordinates to ~1 km and show abbreviated names.
- `AUTH_MODE=strict`: donor routes need the donor's `accessToken`; seeker routes need the `seekerToken` returned by POST /api/requests (`Authorization: Bearer ...`). Keep `open` only while the UI has no login.
- Rate limits on registration, request creation and messaging.

## Before production
- Move to PostgreSQL (change provider + DATABASE_URL).
- Replace in-memory rate limiter and SSE bus with Redis if you run >1 instance.
- Real SMS/voice proxy numbers (Twilio Proxy/Exotel) and prescription file storage (S3) are not included: the UI currently simulates both, so the API stores the file name and a simulated proxy number.
- Add an admin/hospital-verification role before trusting `prescriptionVerified`.
