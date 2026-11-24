# Mjmandelah web

Shop counter for the inventory API. Next.js, signed in with the API bearer token.

```bash
npm install
npm run dev
```

Open http://localhost:3001. The API is expected at http://localhost:3000/api. Override it with `NEXT_PUBLIC_API_URL`.

Follow `docs/PRD.md` for what the shop must do and `docs/API.md` for each route and response. `docs/api.http` has the login and a few GET calls.

The API must allow `http://localhost:3001` in `CORS_ORIGIN`, then be restarted.
