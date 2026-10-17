# CIIVF Backend

FastAPI service for the CIIVF climate-risk dashboard. The system architecture and current developer backlog are in [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md).

## Stack and Modules

- Python 3.10+ (Python 3.11+ recommended), FastAPI, Pydantic, Uvicorn, and Python Socket.IO.
- Google Weather API for current conditions and forecast, with Open-Meteo fallback when Google Weather is unavailable.
- Google Places API (New) for nearby hospitals and shelters.
- Google Earth Engine / WorldPop for population estimates; Sentinel-1 SAR retrieval is available in the ingestion module.
- NOAA IBTrACS North Indian Ocean CSV for historical cyclone tracks. Results are grouped by storm and region, with an in-process six-hour cache.
- `ingestion_layer/constant.py`: names, bounds, coordinates, and history radii for the supported regions.
- `ingestion_layer/index.py`: batch ingestion utility; not called by the HTTP routes. It writes generated images/JSON under `data/ingested/`.
- `utils/list_models.py`: optional Gemini model-listing utility; Gemini is not the historical-data source.

Installable Python packages are listed in `requirements.txt`.

## Setup (PowerShell)

```powershell
cd C:\node\CIIVF-DRAFT-I\CIIVF-Backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

MAC -
```
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, allow it for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Set the values in `.env`:

| Variable | Used for |
| --- | --- |
| `GEE_PROJECT_ID` | Earth Engine project initialization and WorldPop population queries |
| `GOOGLE_MAPS_API_KEY` | Google Weather and Places requests; enable both APIs, billing, and appropriate key restrictions |
| `ALERT_INGEST_TOKEN` | Required server-side secret for `POST /api/alerts`; send it only from a trusted producer |
| `GEMINI_API_KEY` | Optional `utils/list_models.py` utility; not used by the active history endpoint |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Server-only Twilio credentials |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID used to send/check WhatsApp OTPs |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging Service SID with an approved WhatsApp sender attached |
| `TWILIO_WHATSAPP_CONTENT_SID` | Approved Content Template SID used for outgoing alert notifications |
| `WHATSAPP_DATABASE_PATH` | Optional SQLite path; defaults to ignored `CIIVF-Backend/.local/whatsapp.sqlite3` |

Authenticate Earth Engine in a browser-enabled terminal and ensure the Earth Engine API is enabled for the project:

```powershell
earthengine authenticate
```

The API process can start when Earth Engine authentication is missing, but population requests will report an unavailable-source error.

## Start the API

```powershell
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

- Health: `http://127.0.0.1:8000/api/health`
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Vite's development proxy expects this backend at port `8000`.

## REST API

All region-specific endpoints accept one of the keys returned by `GET /api/region`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health |
| GET | `/api/region` | Region names and map bounds |
| GET | `/api/population?region=vizag` | WorldPop population result or source error |
| GET | `/api/shelter?region=vizag` | Nearby hospitals, shelters, and Places diagnostics |
| GET | `/api/current-conditions?region=vizag` | Current weather observation |
| GET | `/api/forecast?region=vizag` | Seven-day forecast; `/api/forcast` remains a legacy alias |
| GET | `/api/history?region=vizag` | NOAA track history, source URL, and region-filtered events |
| GET | `/api/alerts?limit=100` | Newest in-memory alert records |
| POST | `/api/alerts` | Validate, retain, and broadcast a climate alert |
| GET | `/api/whatsapp/configuration` | Report whether OTP and delivery configuration is present |
| POST | `/api/whatsapp/verification/start` | Rate-limited WhatsApp OTP request; phone must be E.164 |
| POST | `/api/whatsapp/verification/check` | Verify OTP and subscribe or unsubscribe the number |

Supported region keys: `vizag`, `odisha` (Puri), `chennai`, `bengal` (Sundarbans), `gujarat` (Saurashtra), `paradip`, `gopalpur`, `kakinada`, `mumbai`, and `bay_of_bengal`.

### Alert Producer Contract

Send alerts from a trusted backend service or sensor gateway. Never expose `ALERT_INGEST_TOKEN` in frontend code.

```powershell
# In a separate local test terminal, set the same value configured in backend .env.
$env:ALERT_INGEST_TOKEN = "replace-with-your-local-test-secret"

$body = @{
	hazard_type = "heavy_rain"
	severity = "high"
	title = "Heavy rainfall threshold exceeded"
	description = "Rainfall exceeded the configured threshold in the monitored area."
	location = @{
		name = "Visakhapatnam"
		region_key = "vizag"
		latitude = 17.6868
		longitude = 83.2185
	}
	source = "trusted-weather-producer"
	measurements = @{ rainfall_mm_per_hour = 82.5 }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod `
	-Uri "http://127.0.0.1:8000/api/alerts" `
	-Method Post `
	-Headers @{ "X-Alert-Ingest-Token" = $env:ALERT_INGEST_TOKEN } `
	-ContentType "application/json" `
	-Body $body
```

Successful ingestion emits the `climate_alert` Socket.IO event. The frontend also loads the REST snapshot on startup. The current alert buffer holds at most 500 records in process memory and is cleared when the server restarts; there is no automatic hazard detector or durable delivery history yet.

## Twilio WhatsApp Setup

Twilio setup is optional. The dashboard and Socket.IO alerts work without WhatsApp configuration.

1. Create/enable a Twilio account with WhatsApp access. For initial testing, configure the Twilio WhatsApp Sandbox and join it from each test recipient. Trial accounts may require recipient verification.
2. Create a Twilio Verify Service and enable WhatsApp as a verification channel. Copy its `VA...` Service SID.
3. Configure a WhatsApp sender/business profile. Create a Twilio Messaging Service and attach that sender; copy the `MG...` SID.
4. In Twilio Console **Messaging → Content Template Builder**, create and submit an approved notification template. Use four body variables in this order:

	```text
	Climate alert: {{1}} | Severity: {{2}} | Location: {{3}} | Details: {{4}}
	```

	The backend supplies title, severity, location name, and description as variables 1–4. Copy the approved `HX...` Content SID. Templates are required for messages outside the WhatsApp 24-hour customer-service window.
5. Add the Twilio values to the backend `.env`, keep those credentials private, and restart Uvicorn. Do not add them to frontend environment variables.
6. In the frontend, use **Settings → Notifications** to request and enter a WhatsApp OTP. The number is stored only after successful verification. Opt-out also requires verification.
7. Submit a climate alert through the trusted `/api/alerts` producer. The backend queues the approved-template message for verified subscribers.

Twilio references: [Verify WhatsApp channel](https://www.twilio.com/docs/verify/api/verification) and [WhatsApp notification templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).

Verified numbers are stored in SQLite at `.local/whatsapp.sqlite3` by default; keep backups/private access appropriate for personal data. OTP requests are limited to three per phone per hour and one per minute. Failed message sends are logged without logging recipients. Production still needs delivery callbacks/statuses, account-wide rate limits, stronger user/admin authentication, retention/deletion policy, and secure managed database storage.

## Provider and Data Notes

- Google Weather is the primary weather source. If its key is missing, a request fails, or Google returns a non-200 response (including quota errors), current conditions and the seven-day forecast fall back to Open-Meteo. The existing response fields are preserved and include `source` / `source_fallback` metadata; verify provider attribution and current Open-Meteo terms before public or commercial deployment.
- Google Places requires an enabled service and valid server-side credentials; it does not use the Open-Meteo fallback. A zero-result Places response can be valid for offshore areas or a narrow radius.
- Nearby facilities are filtered to five kilometres of the selected region coordinates because Google Places text-search location bias is not a strict geographic restriction.
- NOAA history uses the public North Indian Ocean IBTrACS archive, needs outbound network access, and is cached in process memory for six hours. Track data contains no storm-surge measurement; the API returns `null` for surge rather than estimating one.
- Population is a WorldPop aggregation via Earth Engine and depends on a valid project/authentication and available raster coverage.
- Unknown region keys are rejected; add new keys to both `REGION_DATA` and `REGION_COORDS` in `ingestion_layer/constant.py`.
- Production deployment still needs restricted CORS, authentication/authorization, durable storage, monitoring, and rate limiting.
- WhatsApp delivery is attempted in a FastAPI background task; alert records do not include persistent Twilio delivery status or retries.

## Verification

Compile the backend modules with the project virtual environment:

```powershell
python -m py_compile server.py ingestion_layer\constant.py ingestion_layer\population.py ingestion_layer\places.py ingestion_layer\weather.py ingestion_layer\disaster_history.py
```

There is not yet a committed automated backend test suite. Provider behavior should be tested with mocked responses so tests do not depend on live Google/NOAA availability.
