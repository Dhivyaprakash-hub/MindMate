# MindMate

A gentle, mobile-friendly personal reflection space. The original repository was a product concept; this rebuild turns its core ideas into a working, private-by-default browser app with daily mood check-ins, journal notes, rotating reflection prompts, a guided breathing timer, export, and delete controls.

## Use it

No account, API key, paid service, install, or build step is required. Open `index.html` in a browser, or serve the folder with any static file server. For localhost, any basic static server works.

## Privacy

Check-ins and notes are stored in this browser’s local storage and are not sent to an application server. They are not encrypted and may be visible to other people using the same browser profile. Use **Privacy & data** to export or delete them. Clearing browser data also removes saved entries. The app uses no analytics, external AI, trackers, or remote font service.

## Scope and boundaries

MindMate is a self-reflection and mindfulness tool, not therapy, medical advice, diagnosis, or crisis support. The breathing pattern is optional; stop and return to comfortable natural breathing if it does not feel right. No AI chat or health claims are included.

## Structure

- `index.html` — accessible page and navigation structure
- `styles.css` — responsive desktop and phone layouts
- `app.js` — browser-local state, check-ins, journal, export/delete and breathing timer
