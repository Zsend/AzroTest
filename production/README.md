# Production build contract

This directory defines the production data model and API surface required by the GitHub Pages frontend.

It is deliberately vendor-neutral. The public frontend can remain on GitHub Pages; the API and database must run in a secure environment with named accounts, MFA, encryption, private evidence storage, rate limiting, audit logging, backups, and incident response.

Files:

- `schema.sql` — PostgreSQL core schema and invariants
- `openapi.yaml` — API contract for frontend and operations clients

These files are a build contract, not a substitute for security, privacy, employment, cannabis-regulatory, or publication review.
