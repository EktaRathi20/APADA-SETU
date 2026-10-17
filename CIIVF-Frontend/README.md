# CIIVF Frontend

React dashboard for the CIIVF coastal climate-risk prototype. For cross-project architecture and developer handoff, see [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

## Stack

- React 19 and TypeScript 7
- Vite 8 and Tailwind CSS 4
- Leaflet / React Leaflet with OpenStreetMap tiles
- `socket.io-client` for live climate-alert events
- Lucide icons

The manifest also declares packages that are not imported by the active dashboard (for example, Express, frontend dotenv, Google GenAI, and Motion). Check whether an external authoring/runtime environment needs them before removing them.

## Requirements

- Node.js 22 LTS recommended (Vite 8 requires a recent supported Node release)
- Backend API running at `http://127.0.0.1:8000`
- Internet access for external provider requests and OpenStreetMap tiles

## Install and Run (PowerShell)

```powershell
cd C:\node\CIIVF-DRAFT-I\CIIVF-Frontend
npm install --legacy-peer-deps
npm run dev
```

Open the URL Vite prints. The configured port is `3000`; if it is occupied, Vite selects another available port (for example `3001`). The Vite development proxy sends `/api` and `/socket.io` to `127.0.0.1:8000`.

The `--legacy-peer-deps` option is currently needed for the manifest's Vite/esbuild peer-version combination. Keep `package-lock.json` committed so installs are reproducible.

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

Do not put Google or alert-ingestion secrets in Vite variables. They are delivered to the browser. The existing `.env.example` contains AI Studio placeholders; the active source does not read `GEMINI_API_KEY` or `APP_URL` from it.

## Active Data Flow

`src/api.ts` requests regions, population, facilities, current conditions, forecast, and historical cyclone data. `src/climateAlerts.ts` and `src/useClimateAlerts.ts` load the alert snapshot and subscribe to the Socket.IO `climate_alert` event. `src/App.tsx` combines these responses for the selected region.

The overview currently displays:

- Region selector backed by `GET /api/region`.
- Population from the Earth Engine/WorldPop endpoint when configured.
- Current conditions and seven-day forecast from Google Weather.
- Nearby hospitals and shelters from Google Places, filtered to five kilometres.
- Coordinate-based facility markers on an OpenStreetMap basemap.
- Cyclone tracks from the NOAA-backed history endpoint.
- Recent climate alerts and full alert details.

## Main Source Areas

- `src/App.tsx`: app shell, navigation, data requests, region state.
- `src/api.ts`: REST response types and API client.
- `src/climateAlerts.ts`, `src/useClimateAlerts.ts`: Socket.IO and alert snapshot state.
- `src/components/MapComponent.tsx`: geographic basemap and facility markers.
- `src/components/HistoricalDisastersView.tsx`: NOAA history view.
- `src/components/ClimateAlertInbox.tsx`: alert list and details.
- `src/components/modes/` and `src/data/mockData.ts`: legacy/demo feature components. The active app does not wire these as live workflows.

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

Twilio secrets are configured only in `CIIVF-Backend/.env`; they must never be placed in frontend `.env` files. WhatsApp provider setup is documented in the [backend README](../CIIVF-Backend/README.md#twilio-whatsapp-setup).
