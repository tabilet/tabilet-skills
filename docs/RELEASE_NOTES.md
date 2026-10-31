# v2.16.1

Pins the seven canonical skills to `tabilet/skills` v2.16.1. The read-only
sidebar and Goal request builder recognize extended root IDs such as M100 and
M153, including amendment and option records. Frozen history and the API
runner's ten-iteration ceiling remain unchanged. Interactive review records
can display explicitly recorded limits above ten without inferring approval.

Includes the v2.16.0 Goal continuity and authorization changes. Installing the
plugin does not migrate project rules or approve actions. Projects with legacy
nonconforming frozen history still need separate reconciliation; this release
does not change their records. The DSH runtime graph and no-model/no-write
boundaries are unchanged. See [acceptance evidence](ACCEPTANCE.md).

# v2.15.0

Pins all seven canonical skills and their complete resources to `tabilet/skills`
v2.15.0, immutable commit `9659b63dc771d35147e9ae2e09f1122515c462c4`.
Includes required amendments, deferred options and `OPTION_POLICY`, plus the
opt-in reflection, run reporting, light-profile and local-verification policy
updates since v2.13.0. Reflection stays off unless explicitly requested and
requires separately installed tools and enabled project auditing.

The read-only dashboard discovers `amend-M01-01.md` and `option-M01-02.md`,
shows their parent and kind, checks parent declarations and shared child IDs,
and reads child retirement records on demand. Declined rowless options retain
their disposition without inventing completed tasks. Six offline retirement
fixtures were generated against the pinned canonical Python parser.

Goal previews select the bundled protocol with optional project addenda and
accept child IDs; a project-owned `tabilet/GOAL.md` is no longer required.
Previews retain `EXTERNAL_MUTATIONS: none`, use empty authorization grants,
and default to `OPTION_POLICY: confirm` and `OPTIMIZE_POLICY: none`. Preparation
still does not submit, approve, call a model, or change project records.
The SQLite toolkit link now points to the matching v2.15.0 guide.

The stock protocol fingerprint changed. Existing paused goals require the
usual identity-transition approval, preserving grants, denials, counters,
attempts and limits. Installing this companion does not migrate project rules.
The supported runtime graph and Zod peer range remain unchanged. See
[acceptance evidence](ACCEPTANCE.md) for the tested release boundaries.

# v2.13.0

Pins all seven canonical skills to `tabilet/skills` v2.13.0. Goal protocols and
fingerprint registries ship inside complete skill bundles; project
`tabilet/GOAL.md` files are optional addenda. Protocol identities normalize CRLF
to LF and compare hashes rather than release labels. Legacy launches and paused
runs resolve missing or changed identity explicitly, preserving grants and limits.

Includes opt-in, provider-neutral `MODEL_POLICY` with user-selected models and
optional host-supported effort, fresh read-only whole-milestone review, and
evidence-preserving lease cleanup. Approval email handles worker-start failures,
large Unicode summaries and malformed arguments without weakening duplicate or
uncertain-delivery suppression. These are instruction-level workflow contracts;
the companion does not execute workflows or approve actions.

Retains the read-only project SQLite dashboard and Stages view, the Zod 4.6.2
peer minimum, and the rc.1/rc.2 launcher compatibility fix. Installing updated
skills never migrates project files or changes personal DSH profiles. See
[acceptance evidence](ACCEPTANCE.md) for verified release gates and limits.

# v2.11.0

Pins all seven shared skills to canonical `tabilet/skills` v2.11.0. Incorporates
corrective planning (`CORRECTIVE_PLANNING: auto|confirm`) and interactive
approval email alerts (`--email ADDRESS` via Cloudflare REST helper) into Goal
and Next. Incorporates declarative `--test` verification profiles (`standard`,
`browserlight`, `golight`, `rustlight`, `tslight`, `jslight`, `pythonlight`)
and testing standards into `init`, `propose`, `reconcile`, and `tech-stack.md`.
Preserves plugin activation across DSH 0.1.5-rc.1 and 0.2.0-rc.2 launchers,
the read-only SQLite sidebar, Stages view, and all seven canonical skill
bundles. See [acceptance evidence](ACCEPTANCE.md) for tested gates.

# v2.10.3

Compatibility fix; the canonical `tabilet/skills` pin stays at v2.10.1. The
2.10.2 package failed to activate on the DSH 0.2.0-rc.2 launcher
(`@deepseek-ai/dsh@latest`): rc.2 requires a `create()` factory on every strict
Typert codec, so the Web client stopped at "Failed to load plugins". The remote
descriptors now carry both `schema` (rc.1) and `create` (rc.2), and the
declared `peerDependencies` and `engines.dsh` accept `^0.1.5-rc.1 || ^0.2.0-rc.2`.
No dashboard behavior changes. See [acceptance evidence](ACCEPTANCE.md).

# v2.10.2

Companion-only release; it pins canonical `tabilet/skills` v2.10.1 unchanged.
The SQLite sidebar reads the canonical per-project database at
`tabilet/audit.sqlite3` instead of an external path. Registered linked worktrees
share the primary checkout's file while their indexed Markdown stays scoped to
the selected checkout. The sidebar remains read-only, never creates, enables or
refreshes storage, rejects symlinked storage and a database bound to a different
project, reports an older shared file as unsupported, and shows the project's
manual audit setting with the commands to enable, check and disable it. It
pins the canonical `tests/fixtures/project-storage.json` path-resolution
fixture shared with the Python toolkit. See [acceptance evidence](ACCEPTANCE.md).

# v2.10.1

Pins all seven shared skills to canonical `tabilet/skills` v2.10.1, which
includes the bounded verification-attempt gate and expensive-check planning
(v2.10.0), the declarative `--environment` planning option (v2.9.0), and a fix
for invalid `memory-bank-init` front matter that DSH previously dropped. All
seven skills load. Retains the read-only SQLite sidebar, Stages view, and all
seven canonical skill bundles. See [acceptance evidence](ACCEPTANCE.md) for tested gates.

# v2.8.0

Pins all seven shared skills to canonical `tabilet/skills` v2.8.0. Includes the
autonomous goal execution refresh policy (`SUGGESTED_UPDATE: auto`), grant decision
markers (`[ ]`, `[+]`, `[-]`, `[~]`), top-level `GLOBAL:` ambient authority, and
SHA256 launch checksum verification. Retains the read-only SQLite sidebar, Stages view,
and all seven canonical skill bundles. See [acceptance evidence](ACCEPTANCE.md) for tested gates.

# v2.7.0

Pins all seven shared skills to canonical `tabilet/skills` v2.7.0. Retains the
read-only SQLite sidebar, Stages view, and all seven canonical skill bundles.
See [acceptance evidence](ACCEPTANCE.md) for tested gates.

# v2.4.0

The SQLite sidebar now opens the optional external database read-only for the
selected session's project. It browses audit runs and their events, indexed
Markdown documents, and search results. It shows index freshness and
diagnostics, and links to the separately installed local Explorer and its
installation guide. The panel never creates or refreshes the database; project
Markdown remains authoritative. The seven canonical skill bundles are pinned
to `tabilet/skills` v2.4.0.

# v2.3.1

The companion keeps the same canonical v2.3.0 skills and read-only dashboard.
It widens the Zod peer requirement from `^4.6.4` to `^4.6.2`, which matches the
supported DSH rc.2 profile. The source remote schemas passed against Zod 4.6.2;
the earlier lower bound caused a Plugin Market compatibility warning despite no
observed schema failure. No project Markdown or controller contract changes.

# v2.3.0

Pins all seven shared skills to canonical `tabilet/skills` v2.3.0. The sidebar
reads optional `tabilet/stages.md`, shows the current stage and preliminary later
stages, and keeps stage descriptions separate from executable milestone and task
rows. Propose previews can name `--stages` or one stable `STG-` ID; they still
require the user to send the request and approve planning writes. Projects
without `stages.md` retain one implicit stage.

The read-only history view now accepts completed legacy retirement envelopes
that the canonical v2.3.0 parser accepts. SQLite guidance remains available;
the companion never opens the audit database or runs the API controller. The
seven bundled skills, dashboard, and workflow previews remain usable without
changing project Markdown. See [acceptance evidence](ACCEPTANCE.md) for tested
gates and pending publication steps.

# v2.1.0

Pins all seven shared skills to canonical `tabilet/skills` v2.1.0. Adds a
SQLite sidebar view with the optional audit database location, example audit
and Markdown-index commands, and a link to the canonical guide. It distinguishes
the standalone CLI's default path from opt-in API-runner auditing. The dashboard
remains read-only and does not open or modify the database. The tested archive,
verification, and publication record are in [acceptance evidence](ACCEPTANCE.md).
The catalog update subsequently merged and the public listing offers v2.1.0.

# v1.5.0

The companion stages seven complete canonical skills from an immutable
v1.5.0 commit. The Propose shortcut accepts one required multiline requested
change and prepares an approval-gated planning request with no external mutation
authority. It preserves the existing draft, attachment, session, and revision
guards. The dashboard remains read-only. Structural and model-free checks cover
packaging and request integration, not autonomous planning quality. No paid API
acceptance was run. The prebuilt v1.5.0 GitHub archive contains all seven skills.

# v1.4.0

Initial DSH companion release.

The bundle installs the six complete canonical memory-bank skills at bundled
priority and adds the native Memory Bank sidebar. It reads active tasks, current
memory, acceptance evidence, and demand-loaded history. Workflow shortcuts prepare
reviewable conversation requests while preserving existing drafts.

Project Markdown remains authoritative. Installing, updating, disabling, or
removing the plugin does not migrate projects or change their records. Use
`memory-bank-upgrade` to propose explicit adoption of newer project rules.

See [acceptance evidence and publication status](https://github.com/tabilet/tabilet-skills/blob/main/docs/ACCEPTANCE.md) for component
versions, artifact identities, test results, and remaining gates.
