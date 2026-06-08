# Financial Tracker — Frontend

Single-page application for the Financial Tracker, built with **React 19** and **Vite**.
Talks to the Spring Boot backend over a REST API (`/api/v1`) and a STOMP/SockJS
WebSocket for real-time notifications.

## Tech stack

- **React 19** + **Vite 7** (HMR, fast builds)
- **React Router 7** — client-side routing
- **TanStack Query (React Query) 5** — server state, caching, refetching
- **axios** — HTTP client (JWT attached via interceptor)
- **Chart.js** + **react-chartjs-2** — analytics charts
- **i18next / react-i18next** — internationalization (EN / UA)
- **@stomp/stompjs** + **sockjs-client** — WebSocket notifications
- **lucide-react** + **@heroicons/react** — icons
- **sonner** — toast notifications
- **Styling:** inline styles driven by a central theme (`src/styles/theme.js`)
  with light/dark **emerald** themes via a `data-theme` attribute. **No CSS
  framework** (no Tailwind) — global resets/tokens live in `src/index.css`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` and `/ws` to the backend (see `vite.config.js`).
By default the backend is expected on `http://localhost:8080`.

### Scripts

| Command           | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start the Vite dev server (HMR)          |
| `npm run build`   | Production build → `dist/`               |
| `npm run preview` | Serve the production build locally       |
| `npm run lint`    | Run ESLint                               |

## Configuration

The API base URL is read from `VITE_API_URL` (falls back to
`http://localhost:8080/api/v1`):

- **Dev:** set `VITE_API_URL=/api/v1` (in `.env.development`) so requests go
  through the Vite proxy and avoid CORS.
- **Prod:** the CI build sets `VITE_API_URL` to the deployed API origin
  (e.g. `https://financial-trackersite.site/api/v1`).

## Project structure

```
src/
  components/   reusable UI (cards, charts, layout, modals, auth, ...)
  pages/        routed pages (Dashboard, Transactions, Budgets, Goals, ...)
  contexts/     Auth, Theme, Language, Currency providers
  hooks/        useAuth, useTheme, useCurrency, useWebSocketNotifications, ...
  services/     axios API clients per domain
  styles/       theme tokens (light/dark)
  locales/      en / uk translation JSON
  i18n/         i18next setup
```

## Theming

Theme tokens are defined in `src/styles/theme.js` and consumed through the
`useThemedStyles(getStyles)` hook. Components define a
`getStyles(theme, { isMobile, isTablet })` function, so changing a token
restyles the whole app. The active theme is persisted in `localStorage` and
reflected on `<html data-theme="light|dark">`.

## Testing

No frontend test framework is configured yet — only ESLint (`npm run lint`).
Backend tests live in the repository root (`mvn test`).
