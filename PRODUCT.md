# RentkaroPune

RentkaroPune is a Pune-first rental listing website for verified flats, villas, and bungalows. Visitors can browse without an account, contact the team on WhatsApp, or request a callback.

## Audience
- Renters browsing approved Pune homes
- Owners and consultants submitting properties
- Admins verifying inventory and responding to enquiries

## Core flows
1. Visitors browse and filter approved listings without signing in.
2. A visitor uses standard WhatsApp buttons across the site. On a selected property’s mobile footer, the visitor can instead drag the accessible swipe control to open WhatsApp at +91 70453 08514; a direct-link fallback remains available in the property enquiry panel.
3. Callback requests include preferred time and optional language preference: English, Hindi, Marathi, or no preference.
4. The global automated support guide answers common rental questions and hands visitors off to WhatsApp, property search, or the callback popup.
5. Admins view unique visitor totals and callback requests, then mark requests as new, contacted, or closed.
6. Owners submit listings for verification.
7. Admins approve properties and consultant applications.

## Access model
- Login is optional for public browsing and enquiries.
- Signed-in members can manage a profile and request consultant access.
- Consultants and owners submit verified properties from their profile.
- The dashboard is admin-only and focuses on analytics, callback-request handling, and approvals (properties and consultant access).
- Admin APIs enforce server-side role checks.

## Admin dashboard
Admins see visitor analytics, all stored callback requests, the live property approval queue, and consultant access requests. Consultant and property submission workflows live on the profile, not the dashboard.

## Callback lifecycle
- Public visitors submit a callback request (name and Indian mobile required; message, email, preferred time, and preferred language optional).
- Submissions are stored server-side in Firestore. A repeat submission from the same number for the same property updates the existing open request instead of creating a duplicate.
- Each request is either New or Contacted. Admins mark a request Contacted with a single action; the row moves to the Contacted view. This is one-way and enforced in a server transaction, so a request can never be reopened.
- The admin phone field is one-tap copyable, and new requests appear within seconds via background polling.

## Security and privacy
- Strict security headers site-wide: Content-Security-Policy, HSTS (production), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, and Origin-Agent-Cluster.
- Authenticated and personal-data API responses are sent with no-store cache directives.
- Callback and visitor collections are server-only in Firestore rules; no client can read or write personal enquiry data. Properties are publicly readable only when approved.
- Public write endpoints enforce same-origin checks, JSON content-type, a honeypot field, input validation and normalization, and per-IP rate limiting.
- Unique-visitor identity uses a signed, HttpOnly, one-year cookie hashed into a deterministic document id, so analytics never store raw identifiers.

## Visitor counting
A signed, HttpOnly browser cookie identifies a visitor for one year. A Firestore document with a deterministic hashed ID ensures repeat page visits from the same browser are counted once. A different browser, device, or cleared cookie is treated as a new visitor.