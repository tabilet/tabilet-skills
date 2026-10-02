# Publication status

## v2.3.0 preparation

The companion candidate pins the published canonical
[v2.3.0 release](https://github.com/tabilet/skills/releases/tag/v2.3.0) recorded in
`upstream.lock.json`. The proposed catalog entry names the future
`tabilet-skills-2.3.0.tgz` GitHub release asset. The companion archive and
checksum must be released before the catalog URL can be submitted and verified. A local
candidate or catalog YAML file does not establish a published release or
market listing. [Acceptance evidence](ACCEPTANCE.md) records the local checks
and remaining gates. npm publication remains optional for the archive route.

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
