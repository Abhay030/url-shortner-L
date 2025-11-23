# URL Shortener (Full-Stack)

A mini bit.ly-style URL shortener with Node.js + Express backend, Postgres (Neon), and React frontend.

## Live Demo
https://url-shortener-pnxn.onrender.com/

## Features

- Create short links (auto or custom code)
- 302 redirects with click tracking
- View stats per short code
- Delete links
- Clean UI with plain CSS

## Tech Stack

- **Backend**: Node.js + Express, Postgres (Neon)
- **Frontend**: React 18, React Router, plain CSS
- **Database**: Neon (free Postgres)

## Deploy on Render (Free)

1. Push this repo to GitHub.
2. Sign up on [Render](https://render.com) with your GitHub account.
3. Click **New +** → **Blueprint** → connect this repo.
4. Render will read `render.yaml` and create:
   - Backend Web Service (Node.js)
   - Frontend Static Site (React)
5. Set environment variables on the backend service:
   - `DATABASE_URL`: your Neon connection string
   - `BASE_URL`: `https://your-backend-name.onrender.com`
   - `CORS_ORIGIN`: `https://your-frontend-name.onrender.com`
6. Deploy. Your app will be live at:
   - Frontend: `https://your-frontend-name.onrender.com`
   - Backend API: `https://your-backend-name.onrender.com`
   - Health check: `https://your-backend-name.onrender.com/healthz`

## Local Development

### Backend

```bash
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL (Neon or local)
npm install
npm run dev
# Backend runs on http://localhost:4000
```

### Frontend

```bash
cd my-app
npm install
npm start
# Frontend runs on http://localhost:3000
```

## API Endpoints

- `POST /api/links` — Create a short link
- `GET /api/links` — List all links
- `GET /api/links/:code` — Get stats for a code
- `DELETE /api/links/:code` — Delete a link
- `GET /:code` — Redirect to original URL (302)
- `GET /healthz` — Health check

## License

MIT
