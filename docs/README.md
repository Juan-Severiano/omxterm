# Documentation

## Use OMXTerm

1. **[Install](installation.md)** on macOS, Linux, or Windows.
2. **[Try your first session](../README.md#first-session)** and learn a few shortcuts.
3. **[Make it yours](configuration.md)** with fonts, colors, and snippets.

| I want to…                                            | Read                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Understand what OMXTerm does                          | [How it works](how-it-works.md)                                                                              |
| Use tabs, shortcuts, copy/paste, and images           | [Everyday use](usage.md)                                                                                     |
| Fix a problem                                         | [Troubleshooting](usage.md#troubleshooting)                                                                  |
| Follow a setup walkthrough or copy a complete example | [macOS](quick-start/macos.md) · [Linux](quick-start/linux.md) · [Windows / Git Bash](quick-start/windows.md) |
| Change a setting or shortcut                          | [Configuration](configuration.md)                                                                            |
| Edit themes visually                                  | [OMXTerm Studio](configuration.md#edit-visually-with-omxterm-studio)                                         |
| Add transparency or blur                              | [Background effects](configuration.md#background-transparency-and-blur)                                      |
| Set up GNOME, KDE Plasma, Hyprland, or VM graphics    | [Linux desktop tips](quick-start/linux-desktop.md)                                                           |
| Add OMXTerm to the Linux application menu             | [Desktop helper](linux-installer.md)                                                                         |
| Update or uninstall                                   | [Installation guide](installation.md#updating-or-uninstalling)                                               |

The [README](../README.md#platforms-and-downloads) links the latest download;
[release notes](https://github.com/luizomf/omxterm/releases) describe each
published version.

## Contribute

- [Contributing](../CONTRIBUTING.md) — report a problem, propose a change, or open a PR.
- [Development setup](../CONTRIBUTING.md#development-environment) and
  [native prerequisites and tests](development.md).
- [Security policy](../SECURITY.md) — report vulnerabilities privately.
- [MIT License](../LICENSE) and [Third-Party Notices](../THIRD_PARTY_NOTICES.md).

## Maintainer and agent references

Start with [repository instructions](../AGENTS.md) and
[project vocabulary](../CONTEXT.md). These references explain implementation
boundaries and maintenance procedures, rather than everyday use:

- [Product contract](spec.md) and [architecture decisions](adr/README.md).
- [Restty development](restty-development.md) — terminal rendering and dependencies.
- Focused diagnostics: [emoji shaping](emoji-shaping-diagnostics.md),
  [hidden rendering](hidden-rendering-diagnostics.md), and
  [WebGL depth attachments](webgl-depth-diagnostics.md).
- [Versioning](versioning.md) and [release procedures](release.md).
- Agent operations: [issue tracker](agents/issue-tracker.md),
  [triage labels](agents/triage-labels.md), and [domain references](agents/domain.md).
