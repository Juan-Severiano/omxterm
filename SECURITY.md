# Security Policy

## Supported reports

Reports affecting either current `main` or the current published release are
considered. Older releases may not receive security fixes.

## Private reporting

Do not open a public issue or pull request for a suspected vulnerability. Send
the report privately to the email address available on the
[configured maintainer GitHub profile](https://github.com/luizomf).

Include only:

- the affected version or source commit;
- a minimal, safe reproduction;
- the security impact; and
- a proposed mitigation, if known.

Do not include Terminal Payload, terminal or session transcripts, command
history, clipboard data, configuration or environment contents, credentials or
secrets, or private paths or hostnames.

Responses are best effort; no acknowledgment, fix, or disclosure timeline is
guaranteed. Please coordinate public disclosure with the maintainer before
publishing vulnerability details.

## Native installer verification safety

Exact Windows NSIS verification is a destructive installation test, not a
sandboxed extraction. A temporary `/D=` destination does not isolate an existing
OMXTerm installation, registration, shortcuts, or running sessions. The verifier
refuses installation by default and requires deliberate disposable-VM CLI
consent; environment variables are not consent. Unknown inspection and live
process conflicts remain refusals. Follow [the native release procedure](docs/release.md),
preserve a recoverable snapshot and user data, and never weaken OS protections
or run the installer test on a daily-use machine. Unpacked diagnostics are
separate and do not establish exact-installer acceptance.
