# Finish v1.4.0 publication

Use the tested `tabilet-skills-1.4.0.tgz` and its recorded SHA-256 in
[ACCEPTANCE.md](ACCEPTANCE.md). Do not publish a rebuilt or edited archive without
verifying it. Both Git repositories must contain their tested v1.4.0 tags. The
canonical release commit is pinned in `upstream.lock.json`.

Authenticate npm and GitHub in a terminal; never copy credentials into issues,
release notes, or chat. A GitHub token must permit release creation and repository
topic updates. Git push access alone does not establish these API permissions.

After access is available, publish the canonical GitHub release first using only
the v1.4.0 section of its `docs/RELEASE_NOTES.md`. Then attach the companion's exact
archive and checksum to its GitHub release. Pass multiline release notes through
`gh release create --notes-file`, not shell interpolation.

```bash
npm whoami
gh release create v1.4.0 --repo tabilet/tabilet-skills --verify-tag \
  --title 'tabilet-skills v1.4.0' --notes-file docs/RELEASE_NOTES.md \
  tabilet-skills-1.4.0.tgz SHA256SUMS
npm publish ./tabilet-skills-1.4.0.tgz --access public --ignore-scripts
gh repo edit tabilet/tabilet-skills --add-topic dsh-plugin
```

Download `tabilet-skills@1.4.0` from the public npm registry into a new temporary
directory with `npm pack --ignore-scripts`. Check the downloaded SHA-256 against
the tested archive, extract it, verify `upstream.lock.json` and every payload hash,
and install the downloaded archive into fresh disposable DSH Web and headless
profiles. Keep the running personal profiles untouched. Record the registry
integrity and clean-install evidence in `ACCEPTANCE.md`.

The catalog repository-age gate opens **2026-09-14 16:27:47 UTC**. Re-read its
[current rules](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)
before submitting. Copy only [catalog-entry.yml](catalog-entry.yml) to
`data/plugins/tabilet__tabilet-skills.yml` in a fork and submit one pull request;
do not edit the catalog README. Record the pull request as submission pending.
Only mark listed after acceptance and market visibility are verified.
