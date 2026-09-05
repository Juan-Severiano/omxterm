# Isolate the renderer from local capabilities

OMXTerm will keep React and the Terminal Surface in an isolated renderer without
unrestricted Node.js access. The Electron main process owns PTYs, filesystem
access, configuration, logs, and window lifecycle; a minimal preload bridge
exposes only the typed, validated terminal operations and events the renderer
actually needs. This boundary protects the machine and prevents interface code
from depending directly on infrastructure details without adding user-facing
security ceremony.

Linux packaging must preserve that isolation when sandbox prerequisites are
unavailable. Electron, not an unrelated `unshare` probe, decides whether its
sandbox can initialize; failure terminates startup rather than falling back
to sandbox-disabling flags. The supported Linux path uses unprivileged user
namespaces under the host's existing policy, not a project-installed setuid
helper or relaxed global protections.

The pinned app-builder-lib generator has no AppRun override. A narrow,
checksum-guarded build-input correction removes its automatic fallback before
electron-builder is loaded; a packaging hook refuses unprepared bytes. This
accepts explicit dependency-upgrade review rather than relying on an implicit
staging-directory overwrite or modifying finished artifacts. Both the original
and corrected generator bytes are pinned, and extracted AppRun is independently
checked against the reviewed launcher digest before startup.

Native Linux verification observes the launched renderer's user/PID namespace
isolation and each observed thread's seccomp filter mode, no-new-privileges,
and effective capabilities through `/proc`. It neither opens a debugging port
nor broadens production preload or IPC capabilities. Missing or inaccessible
evidence blocks verification. These bounded OS observations are stronger than
PTY readiness or `sandbox: true` configuration, but do not inspect seccomp
filter contents or prove isolation of every future process. The complete
verification contract is maintained in the spec and release procedure.
