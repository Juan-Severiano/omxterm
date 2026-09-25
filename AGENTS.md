# Working on OMXTerm

OMXTerm is a personal desktop terminal for ARM64 macOS, Linux, and Windows,
using Electron, TypeScript, a portable DOM+Restty Terminal Surface, and a local
PTY Adapter. Keep the terminal the product; do not invent adjacent features.

## Working style

- Chat in the user's language; write code, docs, and GitHub artifacts in English.
- Work directly and keep going while the next step is clear and in scope. Make
  routine engineering decisions yourself. Ask only when missing information
  blocks progress or destructive consequences have not already been authorized.
  Carry the owner's task scope into delegations without adding approval steps.
- Prefer the smallest complete solution and existing tools. Avoid speculative
  abstractions, dependencies, and process. Do not add work the user did not ask for.
- Inspect repository state instead of asking the owner to research it. Report
  blockers with evidence and a recommended next step.

## Project context

- Before changing behavior, read `docs/spec.md`, `CONTEXT.md`, relevant
  `docs/adr/` decisions, and the issue when one exists.
- Keep the spec and user-facing docs current with behavior changes. Record durable
  architectural decisions in an ADR; surface conflicts rather than silently
  overriding the contract.
- GitHub: `luizomf/omxterm`. Tracker details live in `docs/agents/issue-tracker.md`;
  label and domain references are alongside it. Read them when needed.

## Changes and delivery

- Check working-tree changes and active branches/PRs before editing. Preserve
  unrelated work and avoid competing with an active writer.
- Default to issue -> branch -> PR -> squash merge. Small documentation and
  agent-instruction maintenance may go directly to `main` with maintainer approval.
  Fork contributors follow `CONTRIBUTING.md`, not maintainer-only operations.
- Create worktrees under `~/sannux-data/worktrees/<repo>/<worktree_name>`.
- Use focused conventional commits. PRs summarize intent, link the issue, and
  record verification and documentation impact. Get an independent review and
  passing required checks before merging.
- Keep issue/PR state accurate. Check a PR's current state before acting; leave
  closed or merged PRs alone unless asked. After integration, clean up task-owned
  branches, worktrees, and temporary resources without losing uncommitted work or
  artifacts still in use.

## Engineering and verification

- Keep modules focused, interfaces small, names clear, and types strict. Follow
  ecosystem conventions; add abstractions or dependencies only for a current need.
- Privileged operations belong in Electron main; preload exposes a minimal typed
  bridge. Preserve renderer isolation, disabled Node integration, and sandboxing
  (Linux exception: ADR 0024). The Terminal Surface imports neither Electron nor
  `node-pty`.
- Validate external input at boundaries, including IPC and PTY data. Avoid shell
  interpolation of untrusted strings. Preserve useful errors without logging
  sensitive payloads; logging follows `docs/spec.md`.
- Prefer test-first changes. Cover new behavior and regressions through observable
  contracts, not implementation details. Mock external I/O in unit tests; use
  scoped integration tests for real PTYs, filesystems, packaging, and GUI behavior.
- Format changed files. For code changes, run `npm run check:portable` (formatter,
  lint, typecheck, tests, build), plus relevant platform/packaging checks. For
  documentation-only changes, formatting and diff checks suffice. Reuse valid
  evidence when nothing relevant changed; state any checks that could not run.
- Do not weaken checks to make them pass. Inspect the final diff for unrelated
  changes, generated files, secrets, and missing docs. Never commit private data,
  credentials, terminal payloads, clipboard contents, or session transcripts.

## Versions and builds

- Follow `docs/versioning.md` for the development baseline and `docs/release.md`
  for releases. Ordinary changes do not bump versions; feature/contract changes
  may advance the `-dev` baseline as documented.
- A request to prepare and publish a release covers the complete delivery,
  including build-environment preparation, verification, tags and uploads. Do not
  request separate approval for each step or a second exact-artifact acceptance.
  Keep technical verification and checksums; manual testing is optional. Report
  unverified risk and genuine blockers rather than adding permission gates.
- Build on each target platform. Collect delivery artifacts and matching checksums
  in the primary checkout's ignored `release/` directory. Identify dogfood builds
  by source SHA; preserve candidates and evidence through verification/publication.
