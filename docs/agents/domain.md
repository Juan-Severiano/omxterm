# Domain docs

OMXTerm has one shared product context:

- [`CONTEXT.md`](../../CONTEXT.md) explains terminology.
- [`docs/spec.md`](../spec.md) defines current observable behavior.
- [`docs/adr/`](../adr/) records durable architectural decisions.

Read the relevant material for context and use shared terms where they clarify
the work. Keep affected contracts and user guides in the same commit as changed
behavior. Verify them against the implementation during review; a PR with no
documentation changes should explain why the existing contract remains accurate. These documents describe the current product and decisions, not an
immutable authority over the maintainer's request. Update specifications,
contracts and ADRs when reconciling documentation with the product. Keep the
current tree about today's product: replace obsolete guidance, explain current
rationale and remove superseded reports rather than retaining historical copies
or banners. Commits, issues and PRs retain the history. Track supported code
defects separately from documentation corrections, without turning every
discrepancy into a release blocker.
