# Publication status

## v1.5.0 GitHub release

The seven-skill v1.5.0 companion is published as a prebuilt archive on
[GitHub](https://github.com/tabilet/tabilet-skills/releases/tag/v1.5.0).
Install and acceptance evidence live in [ACCEPTANCE.md](ACCEPTANCE.md). The
canonical skill tag and companion archive are separate publications; npm and
catalog listing have their own gates. The current environment has no npm login,
so no npm publication is claimed for v1.5.0.

## Finish v1.4.0 publication

The [canonical GitHub release](https://github.com/tabilet/skills/releases/tag/v1.4.0)
and [companion GitHub release](https://github.com/tabilet/tabilet-skills/releases/tag/v1.4.0)
are published. The companion has the required `dsh-plugin` topic. The public
GitHub archive matches the tested artifact and installs into clean disposable
Web and headless profiles. [Catalog PR #5379](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/5379)
was submitted on 2026-09-18. Its PR check and Submission gate both passed, but it
remains open and awaits maintainer review. Remaining gates are npm publication,
public npm artifact verification, and catalog acceptance/market visibility.

Use the tested `tabilet-skills-1.4.0.tgz` and its recorded SHA-256 in
[ACCEPTANCE.md](ACCEPTANCE.md). Do not publish a rebuilt or edited archive without
verifying it. Both repositories already contain immutable v1.4.0 tags; the
canonical release commit is pinned in `upstream.lock.json`.

Authenticate npm in a terminal with `npm login`; never copy credentials into
issues, release notes, or chat. The current agent environment also supplies a
restricted `GITHUB_TOKEN` that overrides the user's saved GitHub login. For future
GitHub writes, prefix `gh` with `env -u GH_TOKEN -u GITHUB_TOKEN` to use the saved
login. Never print token values or alter the environment's token globally.

After npm authentication is available:

```bash
npm whoami
sha256sum --check SHA256SUMS
npm publish ./tabilet-skills-1.4.0.tgz --access public --ignore-scripts
```

Download `tabilet-skills@1.4.0` from the public npm registry into a new temporary
directory with `npm pack --ignore-scripts`. Check the downloaded SHA-256 against
the tested archive, extract it, verify `upstream.lock.json` and every payload hash,
and install the downloaded archive into fresh disposable DSH Web and headless
profiles. Keep the running personal profiles untouched. Record the registry
integrity and clean-install evidence in `ACCEPTANCE.md`.

The catalog repository-age gate opened **2026-09-14 16:27:47 UTC**. Its
[current rules](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
were re-read before submitting [catalog-entry.yml](catalog-entry.yml) in PR #5379.
That PR adds only `data/plugins/tabilet__tabilet-skills.yml`; it does not edit
the generated catalog READMEs. The pinned GitHub release tarball provides a
complete prebuilt installation, so npm publication is not a listing prerequisite.
Address any requested changes in the existing PR rather than opening a duplicate.
Only mark listed after acceptance and market visibility are verified.
