# Compliance & Security — BirdLog

## Regulatory Framework

| Regulation | Applicability | Key requirements |
|------------|--------------|-----------------|
| GDPR | Yes — stores EU user PII (email, location data) | Right to erasure, data minimisation, no unnecessary retention |

## Data Classification

| Data type | Sensitivity | Storage | Retention |
|-----------|-------------|---------|-----------|
| User email | Personal | PostgreSQL, bcrypt-hashed password | Until account deleted |
| Sighting coordinates | Personal (location) | PostgreSQL | Until sighting or account deleted |
| Species data | Public | PostgreSQL | Indefinite |
| API keys (Artdatabanken, OpenAI) | Secret | `.env` file, never committed | Rotate on suspected exposure |

## Security Requirements

- [x] Passwords hashed with bcrypt (never stored plaintext)
- [x] JWT for session auth (`jsonwebtoken`)
- [x] Rate limiting on all API endpoints (`express-rate-limit`)
- [x] Security headers via `helmet`
- [x] CORS restricted to known origins
- [ ] Right to erasure (account deletion) — not yet implemented
- [ ] Data export (portability) — not yet implemented

## Privacy Requirements

- Location data stored only when user explicitly logs a sighting — never silently collected
- Geolocation used client-side for "nearby birds" query only; coordinates sent to server for Artdatabanken lookup but not persisted beyond the sighting record
- No analytics, no tracking pixels, no third-party scripts

## Notes for AI Agents

- Never log `email`, `password`, `latitude`, `longitude`, or JWT token values
- Never add analytics or tracking without explicit user instruction
- Sighting coordinates are PII — treat as sensitive in logs and error messages
