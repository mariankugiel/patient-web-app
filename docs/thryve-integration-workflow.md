# Thryve Integration Workflow

## Overview
This document describes the complete workflow for connecting/disconnecting Thryve data sources (e.g., Withings) through the integrations page.

## Workflow: Toggling Withings Switch ON

### Step 1: User Toggles Switch ON
- User clicks the Withings switch in `/patient/profile/integrations`
- Switch state changes from `false` to `true`

### Step 2: Frontend Handles Toggle
- `toggle("withings")` is called
- Detects Withings is a Thryve integration (ID: 8)
- Calls `handleThryveToggle("withings", true)`

### Step 3: Get Connection URL
- Frontend calls `ThryveApiService.getConnectionUrl(8, redirectUri)`
- Backend endpoint: `GET /api/v1/integrations/thryve/connection-url?data_source_id=8&redirect_uri=...`
- Backend:
  1. Gets or creates Thryve access token for user
  2. Gets connection session token from Thryve API
  3. Builds connection URL: `https://service2.und-gesund.de/dataSourceDirectConnection.html?token=...&dataSource=8&redirect_uri=...`
  4. Returns URL to frontend

### Step 4: Redirect to Thryve
- Frontend receives connection URL
- Shows toast: "Redirecting to connect your account..."
- Redirects: `window.location.href = connectionResponse.url`
- User is taken to Thryve connection page

### Step 5: User Authorizes on Thryve
- User logs in to Withings account on Thryve page
- User authorizes data sharing
- Thryve processes the connection

### Step 6: Thryve Redirects Back
- Thryve redirects to: `/patient/profile/integrations?dataSource=8&connected=true`
- `useThryveRedirect()` hook detects query parameters

### Step 7: Hook Processes Redirect
- Hook extracts `dataSource=8` and `connected=true`
- Maps data source ID 8 → `withings` field
- Updates Supabase `user_integrations` table:
  - Sets `withings: true`
  - Updates `thryve_connections` JSONB with connection timestamp
- Shows success toast: "Withings connected successfully!"
- Cleans up URL parameters
- Reloads page to refresh UI

### Step 8: UI Updates
- Page reloads
- `loadIntegrations()` fetches updated data
- Withings switch shows as `checked={true}`
- Connection status is displayed

## Workflow: Toggling Withings Switch OFF

### Step 1: User Toggles Switch OFF
- User clicks the Withings switch (currently ON)
- Switch state changes from `true` to `false`

### Step 2-4: Similar to ON workflow
- Frontend calls `ThryveApiService.getDisconnectionUrl(8, redirectUri)`
- Backend builds disconnection URL
- Frontend redirects to Thryve disconnection page

### Step 5: User Confirms Disconnection
- User confirms disconnection on Thryve page
- Thryve processes the disconnection

### Step 6: Thryve Redirects Back
- Thryve redirects to: `/patient/profile/integrations?dataSource=8&connected=false`

### Step 7: Hook Processes Redirect
- Hook extracts `dataSource=8` and `connected=false`
- Updates Supabase:
  - Sets `withings: false`
  - Updates `thryve_connections` JSONB with disconnection timestamp
- Shows info toast: "Withings disconnected."
- Reloads page

## Data Flow

```
User Toggle
    ↓
Frontend API Call
    ↓
Backend Thryve Service
    ↓
Thryve API (get connection/disconnection URL)
    ↓
Redirect to Thryve
    ↓
User Authorization
    ↓
Thryve Redirects Back
    ↓
useThryveRedirect Hook
    ↓
Backend API (update integrations)
    ↓
Supabase user_integrations Table
    ↓
UI Refresh
```

## Key Files

### Frontend
- `patient-web-app/app/patient/profile/integrations/page.tsx` - Main integrations page
- `patient-web-app/hooks/use-thryve-redirect.ts` - Handles redirect callback
- `patient-web-app/lib/api/thryve-api.ts` - Thryve API service

### Backend
- `yourhealth1place-backend/app/api/routers/thryve_integration.py` - Integration endpoints
- `yourhealth1place-backend/app/services/thryve_integration_service.py` - Thryve API integration
- `yourhealth1place-backend/app/core/supabase_client.py` - Supabase operations

## Supabase Schema

The `user_integrations` table should have:
- `thryve_access_token` (TEXT) - Stores Thryve access token
- `thryve_connections` (JSONB) - Stores connection status per data source
- `withings` (BOOLEAN) - Quick access to Withings connection status

## Error Handling

- If connection URL fails: Shows error toast, switch remains in previous state
- If redirect processing fails: Shows error toast, user can retry
- If Supabase update fails: Shows error toast, connection may not be saved

## Notes

- The redirect URI must match the integrations page URL exactly
- Connection status is stored in both boolean fields and JSONB for flexibility
- The hook prevents duplicate processing using a ref
- Page reload ensures UI reflects latest connection status

