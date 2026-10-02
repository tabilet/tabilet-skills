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
