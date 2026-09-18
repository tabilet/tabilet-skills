# Publication status

## v2.0.0 GitHub release

The [canonical v2.0.0 release](https://github.com/tabilet/skills/releases/tag/v2.0.0)
and [companion v2.0.0 release](https://github.com/tabilet/tabilet-skills/releases/tag/v2.0.0)
are public. The companion's prebuilt archive and release-specific checksum
download without credentials. [Acceptance evidence](ACCEPTANCE.md) records the
tested archive hash, hosted checks, and live website verification.

## DSH marketplace

The [catalog entry](https://awesome-dsh-plugin.com/p/tabilet/tabilet-skills/)
currently points to the v1.4.0 GitHub archive. [PR #5411](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5411)
changes only `data/plugins/tabilet__tabilet-skills.yml` to the v2.0.0 release
archive. Its source URL, public download, and local entry validation have been
checked. A passing PR check does not publish the update: upstream maintainer
merge and public catalog refresh are still required.

After the PR merges, inspect the catalog entry and public `plugins.json` for the
v2.0.0 archive URL. Download through that URL, compare its SHA-256 with the
release's `SHA256SUMS`, and install it into disposable DSH Web and headless
profiles. Keep personal profiles untouched. Record the public catalog and
installation results in [ACCEPTANCE.md](ACCEPTANCE.md).

This catalog entry uses the GitHub release archive. An npm account and npm
publication are optional and are not needed for the DSH marketplace update.

## Earlier releases

The [v1.5.0 companion](https://github.com/tabilet/tabilet-skills/releases/tag/v1.5.0)
and [v1.4.0 companion](https://github.com/tabilet/tabilet-skills/releases/tag/v1.4.0)
remain available from GitHub. The original [catalog PR #5379](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5379)
merged on 2026-09-18 with a v1.4.0 archive link. Historical acceptance and
publication evidence remains in [ACCEPTANCE.md](ACCEPTANCE.md).
