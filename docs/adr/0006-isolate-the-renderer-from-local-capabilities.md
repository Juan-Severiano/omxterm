# Isolate the renderer from local capabilities

The Terminal Surface runs in a context-isolated renderer without unrestricted
Node.js access. Electron main owns PTYs, filesystem access, configuration, logs
and window lifecycle. A minimal preload bridge exposes only typed, validated
operations and events the renderer needs.

Chromium sandboxing remains enabled on macOS and Windows. Linux deliberately
disables it under [ADR 0024](0024-disable-the-chromium-sandbox-on-linux.md).
Context isolation and the preload bridge remain useful boundaries, but do not
replace the Chromium sandbox or provide equivalent protection.
