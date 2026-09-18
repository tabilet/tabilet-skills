# v1.5.0 local preparation

v1.5.0 is unreleased. The companion pins canonical commit
`6f04eceec7a846428ad98a4c05429c5ee766fc96`, its seven complete skill
bundles, and every payload hash in `upstream.lock.json`. No push, tag,
publication, deployment, or paid model acceptance was run.

## Local verification

- Canonical: `python3 check.py` passed 31 checks; the credential-free DSH
  compatibility suite passed 13 tests; `mkdocs build --strict` passed.
  Rendered website checks found the Propose navigation entry and loaded banner
  at 1440 and 390 pixel viewports with no horizontal overflow.
- Companion: TypeScript check and build passed. All 38 unit, parser, reader,
  request, profile, and packed loader tests passed. The packed artifact includes
  all seven canonical bundles and exact pinned hashes.
- Native DSH: all 10 tests passed on locked rc.2 components and all 10 passed
  with the isolated rc.1 launcher and rc.2 components. Disposable Web and
  headless profiles used a local fixed-response provider. Propose coverage
  includes empty-input validation, multiline preview, no preparation request,
  guarded draft insertion, seven-skill catalog loading, and user-controlled
  model-free submission. Project before/after hashes stayed equal.

## Isolated planning contract review

The skill and shared references were reviewed against these project states:

| Scenario | Required planning result |
|---|---|
| Ordinary feature | Schedule by approved priority and dependencies without defect severity. |
| Small addition to a pending owner | Concise proposal for that row and acceptance; no new milestone ceremony. |
| Candidate promotion | Recheck trigger, obtain a fresh scheduling decision, and remove duplicate candidate work after approval. |
| All-retired ledger | Treat it as initialized; reserve historical IDs and create new active work. |
| Duplicate request | Point to the adequate pending owner; create no second row. |
| Stale or interrupted approval | Re-read affected files and worktree changes, compare the existing diff with approval, and ask again on material drift or collision. |

This is a structural and instruction review, not a model behavior benchmark.
Autonomous planning quality and task acceptance remain unproven without a
separately authorized evaluation. The companion prepares requests only and
never approves or writes a plan.

# v1.4.0 acceptance and release record

Implementation is complete. Publication and catalog gates are tracked separately.
No paid model acceptance was run; skill semantics are unchanged from v1.3.0.

## Release gates

| Gate | Status |
| --- | --- |
| Canonical harness v1.4.0 commit/tag | Published: `603d963529d2b8e67e2a2a8ae79d59d4489f7907` |
| Canonical GitHub release page | [Published](https://github.com/tabilet/skills/releases/tag/v1.4.0): 2026-09-13 21:24:41 UTC |
| Companion GitHub commit/tag | Published: `v1.4.0` |
| Companion GitHub release page/archive | [Published](https://github.com/tabilet/tabilet-skills/releases/tag/v1.4.0): 2026-09-13 21:24:56 UTC |
| Public GitHub archive download and clean install | Passed: exact hash and all payload hashes; disposable Web and headless profiles |
| npm v1.4.0 | Pending: `npm whoami` still reports `ENEEDAUTH` as of 2026-09-13 21:24 UTC |
| Public npm artifact download and clean install | Pending npm publication |
| Repository `dsh-plugin` topic | Added and verified |
| Catalog submission | [PR #5379](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5379) submitted 2026-09-18; awaiting review |
| Catalog automated checks | Passed: PR check and Submission gate, 2026-09-18 |
| Listed in catalog and market | Not listed as of 2026-09-18 10:50 UTC; PR remains open |

Companion repository creation: 2026-09-13 16:27:47 UTC. Under the current
[one-day catalog rule](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md),
eligibility began **2026-09-14 16:27:47 UTC**. The single
entry in [catalog-entry.yml](catalog-entry.yml) was submitted as
`data/plugins/tabilet__tabilet-skills.yml` on 2026-09-18. The catalog's entry
validation and submission checker passed locally. A fresh public archive download
matched the tested SHA-256 below and declared the expected installable bundle.
The submission uses the prebuilt GitHub archive; npm is optional for listing.
A submitted pull request does not establish listing: catalog acceptance and
market visibility remain unverified.

The hosted [PR check](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/actions/runs/35334092562)
completed successfully at 10:27:10 UTC on 2026-09-18, including lint, regression
tests, and the site build. The
[Submission gate](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/runs/105567022269)
passed at 10:27:32 UTC. At 10:50 UTC, GitHub still reported the PR as open with no
merge commit, the entry was absent from the catalog's default branch, and the
[public catalog](https://awesome-dsh-plugin.com/plugins.json) had no matching entry.
Maintainer acceptance and subsequent market publication remain pending.

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
- The release artifact is `tabilet-skills-1.4.0.tgz`; its identity and final test
  summaries are recorded in [acceptance-v1.4.0.json](acceptance-v1.4.0.json). Git source checkouts require a build to generate payload;
  npm and the GitHub release archive include prebuilt code and complete payload.

## Verification

Canonical repository: all **30** checks in `python3 check.py` passed at the tagged
commit. [GitHub CI](https://github.com/tabilet/skills/actions/runs/34772505453) also passed. The retained credential-free all-rc.1 DSH suite passed all **13** tests.
The Python parser verifies **21** shared conformance cases.

Companion: strict TypeScript checking, build, and **38** parser, reader, request,
packaging, profile lifecycle, and runtime tests passed. The packed artifact is
extracted and every pinned payload hash checked. Actual DSH registry tests load
all six skills, preserve override precedence and supporting resources, and
unregister the bundled provider on disposal. CLI tests install, update using an
isolated synthetic version, disable, and remove the package while preserving
unrelated settings and a user skill.

The final packed artifact passed **9 native Playwright Web/headless tests on
rc.2** and **9 tests on the rc.1 launcher with rc.2 components**, with no skipped
or flaky tests. The tests cover:

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
resolved. Review 3 additionally found duplicate counting when an indexed absolute
path and directory discovery named one file. The reader now deduplicates by the
host's file identity; distinct files reusing an ID still warn. Both a focused
regression and the native 120-file fixture cover this case. Initial GitHub CI
exposed a race in attachment fixture setup after clearing DSH's contenteditable;
that independent case now uses a separate session and asserts an empty draft
before uploading. Reloading alone was insufficient because DSH persists drafts. All **38 automated tests** and **18 native runtime tests**
passed after the reader correction. No P1/P2-or-higher implementation findings remain open. A subsequent CI run
exposed DSH’s delayed Internal Testing Notice blocking test navigation; the test
harness now dismisses that specific notice through Playwright’s locator handler.
These test-only follow-ups passed the complete CI suite at
`7fc77ffddbb63c9540496b98edbd51aec8e9fa68` and leave the immutable release
archive unchanged. The published v1.4.0 Git tag remains at
`26360edd3275365129cd705b09323ef8c9a54bce`; its full CI run also passed.

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

## Final tested artifact

- SHA-256: `e78445a1cb1cf4f8503b397bab194cd5336e4d40281671048b0de771ee837a42`.
- npm integrity: `sha512-N3idn9yTHBEvP3iCNhIROEYSgLoQWJxdUBaDJSPY7RYjYFjP//hJTlmD9oFsyE6hSuMv4r0Q/P+g+2++IOhiPg==`.
- Archive: **187,678 bytes**, **33 entries**, **1,025,174 unpacked bytes**.
- Reviewed implementation commit: `9f1ebafd7680ee8b3aaa39586c8098a9e1786aad`.
  Subsequent acceptance-record and CI artifact-upload changes do not alter the npm payload.
- [GitHub CI](https://github.com/tabilet/tabilet-skills/actions/runs/34773489964)
  passed all 38 automated tests and both sets of 9 native tests. Its downloaded
  archive has the **same SHA-256 as the local tested artifact**. The workflow
  explicitly includes the selected JSON reports under the hidden evidence folder.
- [Publication continuation](PUBLISHING.md) records the exact remaining operations.
  The public npm download/install gate cannot pass before npm publication.

## Public GitHub artifact verification

The public release archive was downloaded without authentication on
2026-09-13 at 21:25 UTC. Its SHA-256 matches the tested and CI-built archive; all
**23 pinned payload files** match `upstream.lock.json`. The downloaded archive
installed through the DSH CLI into fresh disposable **Web and headless profiles**,
each containing all six complete skills. No personal DSH profile was changed.
[Download and installation evidence](public-github-v1.4.0.json) records the URL,
identity, and completed checks. This does not substitute for the separate public
npm download/install gate, which remains pending npm authentication and publication.
