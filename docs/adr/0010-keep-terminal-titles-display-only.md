# Keep terminal titles display-only

OMXTerm honors OSC 0 and OSC 2 title requests so shells, tmux, and terminal
applications can provide useful context in the native Terminal Window. The
requested title is untrusted Terminal Payload: OMXTerm accepts only printable
single-line text, removes control and invisible bidirectional formatting
characters, and rejects a request longer than 256 Unicode code points instead
of truncating it. This bound is applied to the raw parsed request before
sanitization. Under the tab model in ADR 0016, an empty or invalid
request restores that Live Terminal Session's starting-shell basename; the
native Terminal Window uses `OMXTerm` only as its final fallback when no session
is selected.

Terminal titles are a one-way display channel. OMXTerm sends no title reports
to the PTY, excludes title contents from logs and does not use them as
application identity or authority. A
rejected request may emit an Operational Event containing only a normalized
reason such as `too-long` or `invalid-characters`.

Startup title delivery uses an explicit synchronization request after the
renderer Adapter establishes its session identity. Main validates the owning
renderer main frame and live session, then republishes its current sanitized
title and BEL marker on the existing ordered title event stream. This avoids
stale start-response snapshots and unbounded caches of unknown session titles.
The tab host subscribes before initial readiness; cancelled owners request no
synchronization, and reconciliation neither selects a tab nor resets attention.

Tests cover sanitization, split/cancelled controls in the pinned parser, startup
synchronization, session ownership, the Electron title API, and the absence of
title replies and logged title contents.
