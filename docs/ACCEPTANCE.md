# v1.4.0 acceptance and release record

Implementation is complete. Publication and catalog gates are tracked separately.
No paid model acceptance was run; skill semantics are unchanged from v1.3.0.

## Release gates

| Gate | Status |
| --- | --- |
| Canonical harness v1.4.0 commit/tag | Published: `603d963529d2b8e67e2a2a8ae79d59d4489f7907` |
| Canonical GitHub release page | Pending: GitHub token rejected release creation with HTTP 403 |
| Companion GitHub commit/tag and release archive | Prepared; publication pending |
| npm v1.4.0 | Pending: machine authentication is not available yet |
| Public npm artifact download and clean install | Pending npm publication |
| Repository `dsh-plugin` topic | Pending: GitHub token rejected topic update with HTTP 403 |
| Catalog submission | Pending repository age and verified publication |
| Listed in catalog and market | Not listed |

Companion repository creation: 2026-09-13 16:27:47 UTC. Under the current
[one-day catalog rule](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md),
earliest eligible submission is **2026-09-14 16:27:47 UTC**. The prepared single
entry is [catalog-entry.yml](catalog-entry.yml), for
`data/plugins/tabilet__tabilet-skills.yml`. Submission must wait for eligibility;
a submitted pull request does not establish listing.

## Components and artifact identity

- Linux, Node **24.14.1**; local acceptance ran on Ubuntu 26.04 with Chromium
  selected through `TABILET_CHROMIUM`. CI uses Ubuntu 24.04 and Playwright's
  installed Chromium. Playwright is **1.56.1**.
- **235 DSH component package entries** locked at **0.1.5-rc.2**, verified against
  installed package versions. The explicit `dsh-launcher-rc1` alias is
  **0.1.5-rc.1**, reproduced with rc.2 dependencies in an isolated module tree.
- Cordis **4.0.2**, React **18.3.1**, TypeScript **5.9.3**, esbuild **0.25.12**,
  pnpm **11.22.0**. `package-lock.json` records transitive integrity.
- `upstream.lock.json` pins canonical **1.4.0** at the full commit above and the
  SHA-256 of every complete skill resource, shared fixture, and canonical license.
  Release staging verifies the Git tree and all hashes before packing.
- The release artifact is `tabilet-skills-1.4.0.tgz`; final identity is recorded
  below after packing. Git source checkouts require a build to generate payload;
  npm and the GitHub release archive include prebuilt code and complete payload.

## Verification

Canonical repository: all **30** checks in `python3 check.py` passed at the tagged
commit. [GitHub CI](https://github.com/tabilet/skills/actions/runs/34772505453) also passed. The retained credential-free all-rc.1 DSH suite passed all **13** tests.
The Python parser verifies **21** shared conformance cases.

Companion: strict TypeScript checking, build, and **37** parser, reader, request,
packaging, profile lifecycle, and runtime tests passed. The packed artifact is
extracted and every pinned payload hash checked. Actual DSH registry tests load
all six skills, preserve override precedence and supporting resources, and
unregister the bundled provider on disposal. CLI tests install, update using an
isolated synthetic version, disable, and remove the package while preserving
unrelated settings and a user skill.

Native Playwright Web/headless acceptance passed **9 tests on rc.2** and **9 tests
on the rc.1 launcher with rc.2 components** before the final upstream pin. Final
artifact rerun results are recorded below. The tests cover:

- Native right-sidebar rendering, six views, task search and complete notes,
  explicit review counters, winning sources, keyboard controls, narrow layout,
  source navigation, and session switching.
- A synthetic project with **120 status files across 17 lanes**; six markers,
  legacy input, retired identities, cancelled records, and history bodies that
  are never read until opened. Parser/reader tests additionally cover completed
  and superseded envelopes, escaped pipes, fenced examples, literal CRLF,
  permanent IDs, invalid markers, duplicate identities, stale goal references,
  interrupted relocation, denied access, large/truncated input, and cancellation.
- External project edits and linked canonical storage edits becoming visible
  within **10 seconds** without restarting DSH.
- All six workflow previews, explicit Goal policies, existing drafts and
  attachments, revision guards, and user-controlled send. A local fixed-response
  HTTP provider proves the prepared request and loaded full skill reach DSH only
  after the test clicks the native Send button. Separate headless submission
  proves the complete skill loads without the Web UI.
- Before/after project hashes and provider request counts show **zero project
  writes and zero model requests while browsing or preparing requests**. Explicit
  test fixture setup and user-send tests contact only the isolated local provider.
  No request is forwarded to a paid provider.

All DSH profiles, session databases, provider logs, generated projects, and raw
browser evidence are outside the shipped payload. The running personal DSH
installation was not changed. Reproduce with `npm run verify`; CI uploads the
per-runtime JSON reports, browser evidence, and packed archive.

## Final review

Review 1 found and corrected missing-file reporting during interrupted
retirement, browser dependencies unavailable through DSH's module loader,
prototype-like marker names, and loss of literal CRLF in retired envelopes.
Regression checks cover these findings. Native submission exposed a DSH
completion-insertion event that reported success without changing an empty draft;
the adapter now uses the public synchronous draft setter after checking session,
revision, plain-text state, attachments, references, and ownership claim. Native
acceptance verifies the resulting request reaches the local provider.

Review 2 inspected the complete host/provider, remote contract, parser, readers,
client lifecycle, workflow guards, build, packed payload, and isolation scripts.
Clipboard absence now falls back to selecting preview text; missing composer and
Goal capabilities are visible. All identified P1/P2-or-higher findings are
resolved. Final verification of this reviewed source is required below before
companion publication.

## Retained limits

- Historical bodies are validated only when opened. A clean active read does not
  certify unopened frozen records or establish milestone acceptance.
- DSH's public skill catalog reports winners. The panel identifies a shadowed
  bundled copy, but cannot enumerate every other losing provider entry.
- Host permissions can deny linked files and outside-workspace directory
  discovery; the panel reports failures and still attempts indexed files. Some
  DSH configurations deny final symlinks. No permissions are changed.
- Per-file dashboard cap: **2 MiB**. Partial, oversized, and unstable reads stay
  incomplete; source navigation remains available.
- The locked Linux targets are the acceptance boundary. Other runtime versions
  and operating systems are not certified by this release.
