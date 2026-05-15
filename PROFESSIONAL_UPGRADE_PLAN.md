# Professional Upgrade Plan

This branch is the isolated workstream for turning the site into a more polished, production-grade product without shipping unfinished changes to `main`.

## Working Rules

- All redesign and product hardening work happens on `professional-preview`
- `main` stays stable until the new version is ready
- Every meaningful push on this branch is intended to be tested through Vercel preview deployments

## Upgrade Priorities

1. Refine mobile and tablet navigation and layout consistency
2. Strengthen landing page visual hierarchy and content density
3. Improve feed, post, and profile page responsiveness
4. Standardize cards, spacing, buttons, and form patterns
5. Tighten performance, bundle weight, and loading states
6. Harden account, editor, and admin flows for production UX
7. Finish a final QA pass before merging back to `main`

## Release Gate

Do not merge this branch until:

- mobile, tablet, and desktop flows are visually consistent
- preview deployments are verified
- no critical console, auth, routing, or responsive issues remain
- the final experience is approved for production
