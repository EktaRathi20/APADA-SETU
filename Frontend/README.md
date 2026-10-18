# APADA-SETU Frontend

React dashboard for the APADA-SETU coastal climate-risk prototype. For cross-project architecture and developer handoff, see [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

## Stack

- React 19 and TypeScript 7
- Vite 8 and Tailwind CSS 4
- React Router for direct, bookmarkable dashboard routes
- Leaflet / React Leaflet with OpenStreetMap tiles
- `socket.io-client` for live climate-alert events
- Lucide icons

## Requirements

- Node.js 22 LTS recommended (Vite 8 requires a recent supported Node release)
- Backend API running at `http://127.0.0.1:8000`
- Internet access for external provider requests and OpenStreetMap tiles

## Install and Run (PowerShell)

```powershell
cd .\Frontend
npm install
npm run dev
```

Open the URL Vite prints. The configured port is `3000`; if it is occupied, Vite selects another available port (for example `3001`). The Vite development proxy sends `/api` and `/socket.io` to `127.0.0.1:8000`.

Keep `package-lock.json` committed so installs are reproducible.

## Common Commands

```powershell
npm run lint
npm run build
npm run preview
```

`lint` runs the TypeScript compiler with no output. `build` creates `dist/`; `preview` serves that production build locally. The Vite proxy is development-only: production hosting needs a same-origin reverse proxy or configured `VITE_API_BASE_URL` and `VITE_SOCKET_URL` values pointing to the deployed backend.

## Environment

The default API base is `/api`; the default Socket.IO URL is the page's origin. Optional Vite variables:

```dotenv
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=http://localhost:8000
```

Do not put Google or alert-ingestion secrets in Vite variables. They are delivered to the browser. The existing `.env.example` contains AI Studio placeholders; the active source does not read `APP_URL` from it.

## Active Data Flow

`src/services/api.ts` requests regions, population, facilities, current conditions, forecast, and historical cyclone data. `src/services/climateAlerts.ts` and `src/hooks/useClimateAlerts.ts` load the alert snapshot and subscribe to the Socket.IO `climate_alert` event. `src/app/DashboardProvider.tsx` loads and shares region data; the route pages consume it from React Router outlet context.

## Routes

The dashboard uses browser routes so each workspace can be opened directly or bookmarked:

- `/login` — dedicated officer login page
- `/overview` — integrated dashboard
- `/baseline`, `/threat`, `/tasks`, `/landfall`, `/recovery`, `/simulator` — operational phases
- `/history` — historical cyclone analogs
- `/alerts` — climate alert inbox

The root path redirects to `/threat`; unknown paths also return to the default threat view. Logging out redirects to `/login`. `src/app/AppRoutes.tsx` owns route declarations and login; `src/app/DashboardProvider.tsx` loads shared dashboard data and passes it through React Router outlet context; `src/app/Layout.tsx` owns the common header/sidebar shell; and `src/pages/` contains one component per route. Production hosting must serve the SPA entry point for these paths.

The overview currently displays:

- Region selector backed by `GET /api/region`.
- Population from the Earth Engine/WorldPop endpoint when configured.
- Current conditions and seven-day forecast from Google Weather.
- Nearby hospitals and shelters from Google Places, filtered to five kilometres.
- Coordinate-based facility markers on an OpenStreetMap basemap.
- Cyclone tracks from the NOAA-backed history endpoint.
- Recent climate alerts and full alert details.

## Main Source Areas

```text
src/
├── app/                    # Router, shared data provider, and application layout
├── components/
│   ├── dashboard/          # Dashboard widgets, maps, modes, and modals
│   └── layout/             # Shared header and sidebar
├── data/                   # Local prototype/demo data
├── features/simulator/     # Scenario simulation logic
├── hooks/                  # Reusable React hooks
├── pages/                  # Route-level page components, including login
├── services/               # REST API and climate-alert socket service
├── types/                  # Shared domain and dashboard types
├── utils/                  # Data transformation and formatting helpers
├── App.tsx                 # Application route entry
├── index.css               # Global styles
└── main.tsx                # React DOM bootstrap
```

- `src/app/AppRoutes.tsx`: route declarations and login/session flow.
- `src/app/DashboardProvider.tsx`: shared dashboard state and API requests, passed to route pages through React Router outlet context.
- `src/app/Layout.tsx`: shared page shell and modal host.
- `src/pages/`: route-level page components, one file per route.
- `src/services/api.ts`: application API endpoint functions.
- `src/services/httpClient.ts`: shared Axios client with GET, POST, PUT, PATCH, and DELETE methods plus centralized interceptors.
- `src/types/api.ts`: REST request/response contracts.
- `src/services/climateAlerts.ts`, `src/hooks/useClimateAlerts.ts`: alert snapshot and Socket.IO event handling.
- `src/features/simulator/simulator.ts`: simulated scenario data and intelligence generation.
- `src/components/dashboard/`: dashboard widgets, maps, and route-specific modes.
- `src/components/layout/`: shared Header and Sidebar components.
- `src/data/mockData.ts`: prototype data used by dashboard views.
- `src/types/`: shared domain models and route outlet data contracts.
- `src/utils/transformers.ts`: API-to-view data transformations.

The `@/` import alias points to `src/`, so imports between these layers can use stable paths without long relative traversals.

## Known Gaps

- Non-overview task, threat, rescue, route, and recovery workflows are not backed by APIs and are shown as unavailable.
- Login and officer identity are local prototype state, not real authentication.
- WhatsApp remains optional. Settings requests a Twilio WhatsApp OTP before subscribing or unsubscribing; verified numbers are stored by the backend. Delivery requires Twilio Verify, a WhatsApp-enabled Messaging Service, and an approved Content Template configured on the backend.
- Population can show unavailable until Earth Engine credentials/authentication are set up. Google Weather/Places errors are displayed when provider setup or coverage is missing.
- OpenStreetMap tiles need internet access; production deployment should use a tile provider and usage policy suitable for the expected traffic.

## Troubleshooting

- **API connection error:** Start the backend on port `8000`; confirm `http://127.0.0.1:8000/api/health` responds.
- **Socket status offline:** Confirm the backend Socket.IO ASGI app is running and the `/socket.io` Vite proxy reaches port `8000`.
- **No weather/facilities:** Read the on-screen provider detail. Verify the Google Weather API or Places API (New), billing, and server-side key restrictions.
- **No population:** Authenticate Earth Engine and configure `GEE_PROJECT_ID` in the backend environment.
- **No facility markers:** The map only plots provider results with coordinates inside the selected region's five-kilometre search radius. Offshore regions may return no facilities.

## Optional WhatsApp Opt-In

Open **Settings → Notifications**, enable WhatsApp, enter a number in E.164 format (for example `+14155552671`), request the WhatsApp code, and verify it. To opt out, turn the toggle off and verify the opt-out code. Dashboard alerts continue even when WhatsApp is disabled.

Twilio secrets are configured only in `Backend/.env`; they must never be placed in frontend `.env` files. WhatsApp provider setup is documented in the [backend README](../Backend/README.md#twilio-whatsapp-setup).
