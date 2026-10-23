# Support native Windows x64 packages

## Context

[ADR 0019](0019-support-native-arm64-releases-on-macos-linux-and-windows.md)
limited Supported Platforms to ARM64. The Windows NSIS packaging, node-pty
ConPTY prebuilds and verification differ between ARM64 and x64 only by
architecture-selected native payloads.

## Decision

Windows x64 is a Supported Platform alongside Windows ARM64. One
`electron-builder.yml` serves both: the node-pty prebuild directory is selected
with the builder `${arch}` macro, so each package contains only its own
architecture. `package-built:win:x64` builds `OMXTerm-<version>-x64.exe`.

Packages are built and verified natively on a host of the target architecture.
`check:win` and `package:verify` select the unpacked directory
(`win-unpacked` for x64), installer name, node-pty prebuild and PE machine type
(0x8664 for x64, 0xAA64 for ARM64) from the host and reject mismatches.

The pinned installer footprint digest of `electron-builder.yml` is updated;
NSIS identity, registry paths, shortcuts and uninstall behavior are unchanged.
Exact installer verification still runs only in authorized disposable VMs
([ADR 0023](0023-verify-exact-nsis-only-in-authorized-disposable-vms.md)).

## Consequences

Releases include an x64 installer and checksum, built by the maintainer on x64
Windows. Linux x64 and Intel macOS remain unsupported.
