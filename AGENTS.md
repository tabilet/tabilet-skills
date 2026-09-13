# Contributor instructions

This repository ships the DSH companion to `tabilet/skills`. Project Markdown
is authoritative. The dashboard reads it; workflow controls only prepare drafts.

- Support Linux, Node 24.14.1, and the locked DSH rc.2 graph. Test the rc.1
  launcher with rc.2 components in isolation too. Never modify a personal DSH
  installation for development or acceptance.
- Generate `payload/` from the immutable commit and hashes in `upstream.lock.json`.
  Edit canonical skills upstream; never maintain independent skill copies here.
- Use DSH session file/navigation/composer services. Never write project records,
  call a model, submit a request, or approve a workflow from this plugin.
- Preserve drafts and attachments. Insertion requires the same session and draft
  revision, an empty plain draft, and no attachments or reference chips.
- Keep history bodies demand-loaded. Report incomplete reads and contradictions.
- Run `npm run verify` and packed-artifact acceptance before release. Record
  remaining release gates honestly in `docs/ACCEPTANCE.md`.
- Ship prebuilt output with no install scripts and no bundled DSH runtime.
- Keep contributors' unrelated changes. Commits group reviewed implementation
  and verification; no project memory-bank is created for this plugin.
