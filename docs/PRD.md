# Product Requirements Document

> Living document. Source of truth for what we're building at the product level. Updated by `/define-prd` and during phase runs when product scope shifts. Last reconciled: 2026-05-27.

## Problem

Swedish birders in the field want to know three things, fast: *what might I see here right now?*, *what is this bird?*, and *let me log it*. Artportalen is the de-facto Swedish observation platform, but its mobile UX makes reporting sightings and finding local context slow and frustrating. There is no good Swedish-first mobile alternative.

## Users

- **Primary (now):** Henrik + friends and family — a small trusted circle of hobbyist birders.
- **Aspirational:** broaden to appeal to both beginners (easy ID + logging) and serious birders (rarity context, life list, Artportalen bridge).
- **Today they use:** Artportalen (clunky on mobile), Merlin (ID only, not Swedish-context), or nothing/paper.

## Goal

Help a birder learn about birds more deeply and make hikes more fun — by making "what's around me, what is this, and logging it" effortless on a phone in the field.

## Success metrics

- **Primary:** Henrik habitually uses BirdLog — not Artportalen — to log sightings on a hike.
- **Secondary (soft):** a friend uses it unprompted on their own walk.
- **Future:** logged sightings can be batch-exported to Artportalen without manual cleanup.

## Scope

- Nearby birds + live rarity context for the user's current location and time.
- Fast bird identification — photo ID and guided (step-by-step) ID.
- Fast sighting logging.
- Life list / Fågelbok (Swedish species browser).
- **Social (read-only, factual):** mutually-accepted friends; view a friend's recent sightings. No reactions, no notifications, no ranking.
- **Future:** batch upload / export of logged sightings to Artportalen.
- **Future:** broaden audience appeal across beginner ↔ expert.

## Non-goals

- **Forever out:** gamification, streaks, badges, scores, leaderboards, engagement/re-engagement hooks. Field guide, not fitness tracker.
- **Forever out:** an interactive social feed (likes, comments, public sharing). Social stays read-only and factual.
- **Out (companion, not replacement):** being a full Artportalen replacement — BirdLog complements it and bridges back to it.
- **Not now:** real-time rare-bird push alerts.
- **Not now:** non-Swedish regions / species.
- **Not now:** web/desktop-first experience — mobile-first only.

## Constraints

- **Team:** solo developer, building in spare time.
- **Budget:** keep running costs as low as possible while it's a hobby project — without sacrificing UX or factual accuracy. OpenAI (photo/guided ID) is the main cost lever.
- **Hosting:** self-hosted on a TrueNAS SCALE box.
- **Language:** all user-facing text in Swedish.

## Stakeholders

| Role | Name | Decision / review / use |
| ---- | ---- | ----------------------- |
| Developer & Product Owner | Henrik Littke | All decisions — scope, architecture, UX, compliance |

## External integrations

- **Artdatabanken SOS API** — species observation data for rarity context (read).
- **OpenAI (GPT-4o)** — photo ID (vision) and guided ID (text).
- **Wikimedia** — species images.
- **Future: Artportalen** — batch upload/export of user sightings (write; mechanism TBD).

## Compliance / regulatory

- **GDPR** — stores EU user PII (email, sighting coordinates).
- **Friend data sharing:** sightings (including coordinates) are visible to a friend only after a **mutual** friend-request/accept handshake. No data shared without both parties opting in.
- Location captured only when a user explicitly logs a sighting — never silently collected.
- No analytics, no tracking, no third-party scripts.

## Open questions

- **Time horizon:** forever-project vs. a concrete "done enough" milestone — undecided.
- **Artportalen upload mechanism:** does Artportalen offer an import/API for writing sightings? Feasibility unknown — gates the batch-upload feature.
- **Direct messages between friends:** possible future feature, not committed.
- **Audience priority:** beginner-first vs. expert-first when broadening beyond friends/family — undecided.
- **Budget ceiling:** no concrete monthly figure set; "as low as possible" for now.
