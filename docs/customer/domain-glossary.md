# Domain Glossary — BirdLog

AI reads this file to understand what domain-specific terms mean. See also `GLOSSARY.md` at the project root (canonical; extended by `/pitch` only).

---

## Terms

| Term | Definition | Notes |
|------|-----------|-------|
| Sighting | A single bird observation: species + location + date + optional notes | Called "observation" in Artdatabanken; "fynd" colloquially in Swedish |
| Life list | The set of unique species a user has ever observed | No gamification — displayed factually, not as a score |
| Rarity context | How common/uncommon a species is in a given area+time, computed from Artdatabanken data | Not a fixed list — calculated live per coordinates |
| Rarity level | Enum: very_common, common, uncommon, rare, not_observed | Displayed as "Unikt fynd" in UI when not_observed |
| Report count | Number of unique observation reports, not individual birds | A flock of 50 birds = 1 report |
| Artdatabanken | Swedish biodiversity data authority; provides the species observation API | Also referred to as SOS (Species Observation System) |
| Artportalen | The public-facing portal for Artdatabanken data | Used for cross-validation |
| Hero card | The prominent card at top of IdentifyPage showing the rarest nearby bird | |
| Guided ID | 4-step wizard (size → colors → habitat → notes) → GPT-4o text completion | |
| Photo ID | Camera capture → GPT-4o vision analysis → species candidates | |
| Species enrichment | Server-side pipeline: AI result → Wikipedia image fetch → DB upsert | |
| Image proxy | Express endpoint proxying Wikimedia image URLs | Needed for CORS; adds caching |
| Sort key | Identifier string for sighting sort order (e.g. `date-desc`, `species-asc`) | Swedish UI label: "Sortering" |
| Bottom sheet | Modal panel sliding up from screen bottom; used for contextual option selection | |
| Flat list | Sightings list without section/month headers; used for non-date sort orders | |
| Rolling window | Time window for "nearby birds" query (last N days) | Default 30 days; user-configurable |

---

## Common Confusions

- **Artdatabanken vs Artportalen**: Artdatabanken is the authority/API; Artportalen is the public UI. We integrate with the API, not the portal.
- **Report count vs individual count**: Artdatabanken counts reports (events), not birds. A single report may describe a flock.
- **Rarity level vs rarity rank**: Level is the categorical label (uncommon, rare…); rank is the numeric position within species found at that location.

---

## Acronyms

| Acronym | Full Form | Meaning |
|---------|-----------|---------|
| SOS | Species Observation System | Artdatabanken's observation API |
| ID | Identification | Identifying a bird species from photo or description |
