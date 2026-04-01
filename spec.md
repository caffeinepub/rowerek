# Rowerek

## Current State
- Backend: flat stable vars (_users, _activities, _messages, _visibility, _userColors). No GPX storage.
- Frontend: Header has theme toggle (dark/light), no GPX button. No auto-refresh polling.
- Badge: counts new other-user activities vs snapshot, but only recalculated on manual refresh or app load. Friends' new activities never appear without manual refresh.
- PWA icons: round, blue-turquoise gradient, 192x192 and 512x512.

## Requested Changes (Diff)

### Add
- Backend: GPX file storage (_gpxFiles stable var, _nextGpxId). Functions: addGpxFile, getGpxFiles, deleteGpxFile. Auto-delete oldest when exceeding 3 files.
- Frontend: GpxPanel component (drawer/sheet) -- upload .gpx file, show list with username+filename, download button per file.
- Frontend: GPX button in Header (replaces theme toggle).
- Frontend: Auto-refresh polling every 60 seconds (background, no spinner).
- Frontend: Badge update on every poll cycle, not just on manual refresh.

### Modify
- Header: remove theme toggle (dark/light) button. Add GPX button.
- App.tsx: add polling interval, pass GPX panel state.
- Badge logic: snapshot updated at end of loadAll, cleared only when user manually taps the bike icon (not on every focus).
- PWA icon: regenerated to be larger bike, filling full icon area.

### Remove
- Header: theme toggle button (Sun/Moon).

## Implementation Plan
1. Add GPX stable vars and functions to main.mo (careful not to change existing stable vars).
2. Update backend.d.ts with GPX types and functions.
3. Regenerate PWA icon (bigger bike).
4. Update Header: remove theme toggle, add GPX button.
5. Create GpxPanel component.
6. Update App.tsx: polling every 60s, pass gpxOpen state, fix badge snapshot logic.
7. Validate and deploy.
