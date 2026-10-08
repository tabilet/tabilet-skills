# Publication status

## v2.7.0 canonical release update

The companion pins the canonical [v2.7.0 release](https://github.com/tabilet/skills/releases/tag/v2.7.0)
by commit and file hashes. Its [v2.7.0 GitHub release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.7.0)
serves the tested archive and checksum. [Catalog PR #6423](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6423)
points to that archive.

## v2.4.0 SQLite browser

The SQLite browser is implemented and packed verification passed. The companion
pins the [canonical v2.4.0 release](https://github.com/tabilet/skills/releases/tag/v2.4.0)
by commit and file hashes. Its [v2.4.0 GitHub release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.4.0)
serves the tested archive and checksum; both assets downloaded publicly and the
archive matched the tested local and hosted files. [Catalog PR #6423](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6423)
now points to that archive. Its catalog check, submission gate, and the
companion's hosted main and tag verification passed; the live market listing
awaits maintainer merge. The [acceptance evidence](ACCEPTANCE.md) records the
gate results. npm publication is optional for this GitHub archive route.

## v2.3.1 peer compatibility patch

The patch release keeps the canonical v2.3.0 skill pin and lowers the companion
Zod peer minimum to 4.6.2, matching the supported DSH rc.2 dependency graph.
The [v2.3.1 release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.3.1)
serves the verified archive and checksum. The public archive matches the local
and hosted CI artifacts. At this release,
[catalog PR #6423](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6423)
pointed to that archive and its catalog check passed. The PR was later updated
to v2.4.0. The existing v2.1.0 and v2.3.0 archives remain immutable.

## v2.3.0 GitHub release and catalog submission

The companion pins the published canonical
[v2.3.0 release](https://github.com/tabilet/skills/releases/tag/v2.3.0) recorded in
`upstream.lock.json`. Its [v2.3.0 release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.3.0)
serves the tested archive and checksum. Both assets were downloaded without
credentials and the public archive matched the local tested artifact.
[Catalog PR #6423](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6423)
initially submitted the updated source YAML. Its check and submission gate
passed; later revisions superseded the proposed archive. [Acceptance
evidence](ACCEPTANCE.md) records the verified gates. npm publication remains
optional for the archive route.

## v2.1.0 GitHub release and DSH catalog

The companion pins the canonical
[v2.1.0 tag](https://github.com/tabilet/skills/releases/tag/v2.1.0) and adds a
read-only SQLite guidance view to the DSH sidebar. The panel explains the
optional database location, gives audit and index command examples, links to the
canonical SQLite guide, and clarifies that automatic API-runner auditing is
opt-in. It does not open or modify the database.

The companion [v2.1.0 GitHub release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.1.0)
is public. Its tested archive and release-specific `SHA256SUMS` are publicly
downloadable; [acceptance evidence](ACCEPTANCE.md) records the hash and hosted
verification runs.

The DSH catalog update merged as
[PR #5907](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5907)
on 2026-09-25.
It changes only `data/plugins/tabilet__tabilet-skills.yml` to use the v2.1.0
archive and the
[v2.1.0 catalog descriptions](https://github.com/tabilet/tabilet-skills/blob/v2.1.0/docs/catalog-entry.yml).
The
official
[catalog contribution guide](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
requires a valid `dsh.bundle`, working code, the `dsh-plugin` repository topic,
and a repository at least one day old. It says generated catalog READMEs must
not be edited manually.

The [current catalog entry](https://awesome-dsh-plugin.com/p/tabilet/tabilet-skills/)
and `plugins.json` point to the v2.1.0 archive. The earlier
[PR #5411](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5411)
merged with the v2.0.0 archive URL.

## v2.0.0 publication record

The [canonical v2.0.0 release](https://github.com/tabilet/skills/releases/tag/v2.0.0)
and [companion v2.0.0 release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.0.0)
are public. The companion's prebuilt archive and release-specific checksum
download without credentials. [Acceptance evidence](ACCEPTANCE.md) records the
tested archive hash, hosted checks, and live website verification.

The catalog PR #5411 merged and its entry points to the companion's v2.0.0
archive. After a future catalog PR merges, verify the public entry and
`plugins.json`, download the linked archive, compare its SHA-256 with the
release checksum, and install it into disposable DSH Web and headless profiles.
Record those results in [ACCEPTANCE.md](ACCEPTANCE.md).

This catalog entry uses the GitHub release archive. npm publication is optional
and is not needed for a DSH marketplace update.

## Earlier releases

The [v1.5.0 companion](https://github.com/tabilet/tabilet-skills/releases/tag/v1.5.0)
and [v1.4.0 companion](https://github.com/tabilet/tabilet-skills/releases/tag/v1.4.0)
remain available from GitHub. The original [catalog PR #5379](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5379)
merged on 2026-09-18 with a v1.4.0 archive link. Historical acceptance and
publication evidence remains in [ACCEPTANCE.md](ACCEPTANCE.md).
