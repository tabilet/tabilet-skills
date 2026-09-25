# Publication status

## v2.1.0 candidate

The companion package candidate targets the canonical
[v2.1.0 tag](https://github.com/tabilet/skills/releases/tag/v2.1.0) and adds a
read-only SQLite guidance view to the DSH sidebar. The panel explains where the
optional database lives, provides audit and index command examples, and links
to the canonical SQLite guide. It does not open or modify the database.

The package version, plugin manifest, and catalog-entry preview are set to
2.1.0. The candidate has not been published. The v2.1.0 companion GitHub
release, repository push, tag, and catalog PR are separate publication steps.
The catalog submission should update only
`data/plugins/tabilet__tabilet-skills.yml` with the v2.1.0 archive URL and the
descriptions in [catalog-entry.yml](catalog-entry.yml). The official
[catalog contribution guide](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
requires a valid `dsh.bundle`, working code, the `dsh-plugin` repository topic,
and a repository at least one day old. It says generated catalog READMEs must
not be edited manually.

The [current catalog entry](https://awesome-dsh-plugin.com/p/tabilet/tabilet-skills/)
points to v2.0.0. The earlier
[PR #5411](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5411)
merged with that archive URL; it is not the pending v2.1.0 submission.

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
