# Publish tested arm64 releases without verified publisher identities

This ADR owns the macOS-specific artifact and Gatekeeper policy. The broader
Supported Platform, native-build, verification, and publication policy is
recorded in
[ADR 0019](0019-support-native-arm64-releases-on-macos-linux-and-windows.md).

OMXTerm publishes ready-to-run Apple Silicon macOS `.dmg` artifacts with source
tags and SHA-256 checksums. Native build and exact-artifact verification are
separate from behavioral evidence; the [release procedure](../release.md) owns
those checks and publication. The application has no automatic update mechanism.

The application uses neither Apple Developer ID signing nor notarization. This
keeps paid Apple distribution services outside the obligations of a small
open-source project, with the tradeoff that users must complete a deliberate
one-time Gatekeeper review. The assembled application still receives a complete
ad-hoc code seal because Apple Silicon requires internal code integrity even
without a verified publisher identity. An ad-hoc seal provides bundle integrity;
it does not identify the publisher, satisfy Gatekeeper trust, or replace
Developer ID signing and notarization.

Automated package verification must run `codesign --verify --deep --strict`
against the assembled application and reject both an invalid seal and any
unexpected signing authority or Team ID. Browser-quarantined Gatekeeper
exercise is optional macOS dogfood, not a release gate, even when packaging,
code sealing, or Gatekeeper-facing metadata changes. When automation cannot
observe the resulting security UI, the release record states that boundary as
unverified. Release notes state that the application lacks Developer ID signing
and notarization; the DMG itself is unsigned.
A locally built artifact without quarantine is never represented as independent
Gatekeeper evidence.

Installation guidance links to Apple's current review instructions without
asking users to disable system-wide macOS protections.
