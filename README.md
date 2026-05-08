# Network Hub

A production-ready technical publishing platform built with React, Vite, and Firebase. It includes a public post feed, author profiles, a writing studio, and a security-focused admin console with analytics, audit logging, and moderation tooling foundations.

## Overview

The app is structured around three major areas:

- `Network Hub`: the public landing page and paginated post feed
- `Studio`: the authenticated writing/editing experience
- `Admin Panel`: site governance, telemetry, user registry, archive tools, audit history, and suspicious activity alerts

## Current Features

### Public Experience

- Paginated public post feed
- Featured landing-page story on page 1
- Search, category, and type filters
- Public author profile views
- Markdown-based post display

### Studio

- Rich-text editing with Tiptap
- Post create, edit, and delete flows
- Cover image upload support
- Server-side AI summary generation

### Admin

- Master dashboard with live site metrics
- User registry and post archive views
- Active user records
- Anonymous visitor tracking
- Audit log card with filters and CSV export
- Dedicated full audit history page with date filters
- Suspicious activity alerts

### Security and Reliability

- Firestore rules-based access control
- Admin action audit logging
- Gemini API key kept server-side
- Safer profile updates that avoid overwriting unrelated fields
- Production-safe pagination that does not advance to empty pages

## Tech Stack

- `React 19`
- `Vite`
- `TypeScript`
- `Tailwind CSS`
- `Firebase Auth`
- `Cloud Firestore`
- `Firebase Storage`
- `Vercel`
- `Tiptap`

## Project Structure

```text
src/
  components/
  core/
  features/
    admin/
    blog/
    user/
  hooks/
  lib/
  services/
api/
  summarize.js
firestore.rules
storage.rules
firebase.json
```

## Environment Variables

Create a local `.env` file with:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_ID=your_database_id
GEMINI_API_KEY=your_server_side_key
```

Notes:

- `GEMINI_API_KEY` must remain server-side.
- Do not expose Gemini credentials with a `VITE_` prefix.
- `VITE_FIREBASE_DATABASE_ID` should match the Firestore database actually used by the project.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run preview
```

## Firebase Setup

This project depends on:

- Firestore
- Firebase Authentication
- Firebase Storage

Deploy Firestore rules:

```bash
npx firebase-tools deploy --only firestore:<database-id>
```

Deploy Storage rules:

```bash
npx firebase-tools deploy --only storage
```

If your Firebase project uses a named Firestore database instead of `(default)`, make sure `firebase.json` and your deploy command point to the correct database ID.

## Production Notes

- Public feed pagination is cursor-based and optimized for Firestore.
- Numbered pages are shown only after the page is confirmed to exist.
- Admin telemetry has been reduced to avoid unnecessary Firestore quota pressure.
- New image uploads should use Firebase Storage URLs instead of base64 document payloads.
- Older posts may still contain legacy base64 image data until migrated.

## Security Notes

- Admin-only actions are logged to `auditLogs`.
- The summarize endpoint is server-side, but rate limiting can still be improved further.
- Firebase rules are a required part of the production security model.

## Remaining Recommended Improvements

- Add a full post moderation queue
- Add server-side audit pagination
- Add stronger rate limiting and abuse protection for `api/summarize`
- Continue reducing bundle size
- Migrate any legacy base64 image records still stored in Firestore
- Add automated regression tests for admin, auth, and editor flows

## Deployment

The app is deployed on Vercel and uses Firebase as the backend platform.

Typical production flow:

1. Push changes to GitHub
2. Vercel builds and deploys the frontend
3. Firebase rules are deployed separately when backend security changes are made

## Status

Current repo status:

- build passes
- lint passes
- public pagination is stable
- admin audit logging is active
- signed-in activity tracking is working
- suspicious activity alerts are active

