# tabilet-skills

Seven shared engineering skills and a Memory Bank sidebar for DeepSeek Harness.
The same project Markdown remains usable from DSH, Codex, and Claude Code.
The canonical skills and project format live in
[tabilet/skills](https://github.com/tabilet/skills).

Version **2.1.0** pins the canonical v2.1.0 skills and adds an SQLite audit
guide view to the read-only sidebar. See
[acceptance and publication status](https://github.com/tabilet/tabilet-skills/blob/main/docs/ACCEPTANCE.md)
for the separate GitHub, npm, and catalog release gates.

## Install

Supported target: Linux, Node **24.14.1**, DSH **0.1.5-rc.2**. The test installation
locks all components. An isolated rc.1 launcher with rc.2 components is also
checked; this is separate from the canonical repository's all-rc.1 suite.
Install DSH separately. This package ships prebuilt output, complete skill
resources, and no installation scripts or DSH runtime.

Install in each profile where you want the skills:

```bash
dsh plugin --profile web add https://github.com/tabilet/tabilet-skills/releases/download/v2.1.0/tabilet-skills-2.1.0.tgz --ignore-scripts
dsh plugin --profile headless add https://github.com/tabilet/tabilet-skills/releases/download/v2.1.0/tabilet-skills-2.1.0.tgz --ignore-scripts
```

Restart the profile, open a project session, expand the native right sidebar,
and choose **Memory Bank**. The v2.1.0 headless package loads all seven skills,
including Propose, without the Web UI.
You can also replace the package/version with the absolute path to the prebuilt
archive from the [GitHub release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.1.0).
Git source checkouts require the build step below to generate the complete payload.

For skills without the dashboard, use the canonical
[filesystem installation](https://github.com/tabilet/skills/blob/v2.1.0/docs/DSH.md#install-the-seven-bundles).
Both routes use complete canonical skill directories. Project and user overrides
retain DSH's normal precedence. The Compatibility view reports winning sources
and marks a bundled copy shadowed by an override. Other shadowed copies are not
enumerated by DSH's public registry. Review local overrides before removing them.

## Read project records

- **Overview:** active milestones, all six marker counts, blocked rows, and work
  in progress.
- **Tasks:** milestone, lane, and state filters, text search, full task notes,
  and source navigation.
- **Acceptance:** recorded verification/review lines and an explicit current
  review counter when the record supplies one. Unknown and conflicting evidence
  stay visible. Terminal rows do not prove acceptance.
- **Memory:** product, architecture, stack, and curated lessons.
- **History:** retired index, complete preserved records, knowledge history,
  and context archives. Historical bodies load only when opened.
- **Compatibility:** missing or malformed files, unsupported legacy state,
  duplicate identities, multiple in-progress rows, and skill sources.
- **SQLite:** the optional external audit database, its location, and commands
  to inspect audit runs or browse the Markdown index. The sidebar does not open
  the database; use the separately installed CLI or local explorer. See the
  [SQLite audit and lookup guide](https://github.com/tabilet/skills/blob/v2.1.0/docs/sqlite.md).

The v2 sidebar reads an unmigrated v1.5.0 project with a migration warning and
offers source navigation. Workflow request controls are hidden until the
project is explicitly migrated. The canonical Upgrade bundle includes
`migrate-v1.5-to-v2.py`, a read-only preview by default and an explicit
`--apply` mode. Installing this package never runs migration.

The panel follows the selected session. DSH observations, a five-second visible
refresh cycle, focus, and manual refresh detect changes. File versions control
the content cache. Interrupted or partial reads are labelled incomplete/stale.
Local canonical paths follow the host's existing permissions; denied paths are
reported. Some DSH configurations reject final symlinks or directory listings
outside the workspace. No permission changes or copied project memory are used.

Documents are displayed as literal text. Embedded HTML, images, and remote URLs
do not execute or load. Files larger than 2 MiB are reported as unsupported in
the dashboard; source navigation remains available. Viewing and refreshing make
no model requests and no project writes.

## Prepare a workflow request

Expand **Prepare a workflow request** and choose Next/Resume, Goal, Propose, Reconcile,
Upgrade, Init, or Archive. Every shortcut opens a preview. Goal requires an
explicit milestone order and completion conditions, defaults to `COMMIT_POLICY:
task`, offers `none`, and includes `EXTERNAL_MUTATIONS: none`.

Propose requires one multiline requested-change field. It prepares a request
for inspection and one complete planning proposal before any writes, with
`EXTERNAL_MUTATIONS: none`. The preview preserves line breaks and never sends
itself.

Reconcile accepts a local review path or a user-supplied URL as text. Preparation
does not fetch it; the skill still requires separate confirmation before any
remote review fetch. Init, Archive, Propose, Reconcile, and Upgrade retain their proposal
and write approval gates.

**Insert into empty draft** succeeds only in the same session and unchanged,
empty plain-text draft without attachments or reference chips. Otherwise your
draft remains intact and the preview can be copied. You send the request normally.
The controls never submit, queue work, approve proposals, or edit task markers.
A marker does not establish exclusive ownership of the ledger.

Existing compatible projects work directly. Updating this plugin does not
migrate project rules. Use the explicit Upgrade workflow when adopting a newer
contract; preserve permanent IDs, task history, and local policies.

## Update or remove

Install the selected exact version with the same profile-specific command and
restart DSH. To roll back, disable the `tabilet-skills` row in that profile's
`cordis.patch.yml`, or remove just this package:

```bash
dsh plugin --profile web remove tabilet-skills
dsh plugin --profile headless remove tabilet-skills
```

Project memory, unrelated plugins, and direct filesystem skill installs remain
available. A disabled bundle leaves its payload on disk but unregisters its
provider and UI; removal removes its profile bundle layer.

## Develop and verify

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm install --global pnpm@11.22.0 --ignore-scripts --no-audit --no-fund
npx playwright install --with-deps chromium
npm run verify
npm pack --ignore-scripts
```

`upstream.lock.json` pins the canonical version, full commit, and every payload
hash. `npm run build` generates `payload/` from that commit, using a sibling
checkout when available or an isolated fetch of the exact commit. Never edit
generated skills. To deliberately advance to a reviewed canonical local commit:

```bash
node scripts/upstream.mjs pin ../skills HEAD
npm run verify
```

On a Linux distribution not recognized by Playwright, set `TABILET_CHROMIUM` to
a compatible Chromium executable for the Web tests. CI is credential-free. No paid workflow runs are part of this release's plugin
acceptance. [Contributor instructions](AGENTS.md) and
[acceptance evidence](docs/ACCEPTANCE.md) describe test boundaries and limitations.

## Publication and catalog

Track GitHub/npm publication, catalog submission, and listing separately.
[The catalog rules](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
require an installable bundle, working code, the `dsh-plugin` repository topic,
and a repository at least one day old. The submission is one YAML entry;
listing is confirmed only after acceptance and market visibility.

The DSH catalog entry is updated through a separate reviewed submission. If a
new release is not yet listed, install its prebuilt archive from the GitHub
release above. npm publication is optional for this route.
