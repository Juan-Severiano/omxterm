# Windows quick start

[Install OMXTerm](../installation.md#windows) and open it. Windows PowerShell,
bundled fonts, and colors are ready to use. Try one setting change and a saved
command below. The optional [complete example setup](#complete-ready-to-use-setup-optional)
uses Git Bash instead.

## 1. Open your settings folder

Run this in **PowerShell** to open the folder:

```powershell
$configRoot = if ($env:XDG_CONFIG_HOME) { $env:XDG_CONFIG_HOME } else { Join-Path $HOME '.config' }
$configDir = Join-Path $configRoot 'omxterm'
New-Item -ItemType Directory -Path $configDir -Force -ErrorAction Stop | Out-Null
Invoke-Item -LiteralPath $configDir
```

The default is `%USERPROFILE%\.config\omxterm`. If you set `XDG_CONFIG_HOME`
before launching OMXTerm, use its `omxterm` subfolder instead. Changing that
variable inside PowerShell does not move the running app's settings.

The first launch creates `config.json`, `snippets.json`, and
`themes/omtheme.json` when no configuration exists. An existing `config.json`
keeps your setup and skips that starter kit. For missing files, use the
[minimal configuration](../configuration.md#quick-start-use-the-bundled-defaults),
[snippet example](../configuration.md#snippets), and
[complete theme](../configuration.md#terminal-themes).

Back up files before editing. In Notepad's Save As dialog, choose **All files**
and UTF-8. Explorer's **View → Show → File name extensions** helps check that
the name stays `config.json`, not `config.json.txt`.

## 2. Make the text comfortable

Open `config.json`, find `size` inside the `font` object, and change `16` to `18`.
If that field is missing, follow the [font example](../configuration.md#add-one-display-change)
to add it while keeping your other settings.

Save, then press and release **Alt alone** to open the application menu. Choose
**View → Reload User Configuration** (`Ctrl+Shift+,`). The text gets larger;
change it back to `16` to undo it. If an error appears, fix the named field and reload.

For temporary font zoom, use `Ctrl++` / `Ctrl+-`; `Ctrl+0` returns to your configured
size. [Fonts and spacing](../configuration.md#add-one-display-change) covers
line height, padding, and installed fonts.

## 3. Try a snippet

Open `snippets.json` and find **Hello from OMXTerm**, the starter greeting. If
it is missing, add the [single-line snippet example](../configuration.md#snippets)
to your existing array, or use that complete example for a new file. Its `pwd`
command works in PowerShell too.

Open **View → Toggle Snippets** (`Ctrl+Shift+S`). Click the greeting or your chosen
single-line snippet with `execute: false`, review the inserted command, then
press Enter. Close and reopen the sidebar after editing the file.

## 4. Make it yours

- **Colors:** edit the theme selected by `theme.path` and reload, or use
  [OMXTerm Studio](../configuration.md#edit-visually-with-omxterm-studio).
- **Background:** [enable blur and positive transparency together](../configuration.md#background-transparency-and-blur)
  for Acrylic on Windows 11 22H2 or later. If native effects are unavailable or
  disabled by system policy, the background stays opaque.
- **Window bars:** `Ctrl+Shift+D` toggles the title bar; `Ctrl+Shift+B` toggles
  the tab bar. [Set defaults for new windows](../configuration.md#start-with-hidden-bars).
- **Shell:** [choose another installed shell](../configuration.md#choose-the-windows-default-shell),
  such as PowerShell 7 or Git Bash. Reload and open a new tab to use it.

Continue with [everyday use](../usage.md), [shortcuts](../configuration.md#keybinds),
or [when settings take effect](../configuration.md#reloading-user-configuration).

<a id="optional-git-bash-examples"></a>

## Complete ready-to-use setup (optional)

Install [Git for Windows](https://gitforwindows.org/) to get Git Bash. The example
expects `C:\Program Files\Git\bin\bash.exe`; check that it exists, or change
`windowsShell` to your actual path. Use doubled backslashes in JSON, as shown
in the linked configuration.

These three files use bundled fonts and built-in shortcuts. Destinations are
inside your [settings folder](#1-open-your-settings-folder):

| Download                                                          | Copy to               |
| ----------------------------------------------------------------- | --------------------- |
| [config.json](files/windows/config.json) — selects Git Bash       | `config.json`         |
| [snippets.json](files/windows/snippets.json) — Bash commands      | `snippets.json`       |
| [themes/omtheme.json](files/windows/themes/omtheme.json) — colors | `themes/omtheme.json` |

1. Download each file using GitHub's **Download raw file** button. Alternatively,
   choose **Code → Download ZIP** on the repository's **main** branch, use
   **Extract All**, and open `docs\quick-start\files\windows`.
2. Copy your existing destination files to a separate backup folder first,
   preserving the `themes` subfolder. Keep that backup to undo the changes.
3. Copy the three examples into the destinations above, creating `themes` if
   needed. This replaces your preferences; merge individual fields instead if
   you want to keep other choices.
4. Reload configuration, open a **new tab** (`Ctrl+Shift+T`) to start Git Bash,
   and close/reopen the snippets sidebar.

Try **Go to home directory**: it inserts ` cd "$HOME"`; press Enter to return
home. All seven snippets are single-line and have `execute: false`. They use
Bash syntax; other snippets use Windows tools such as `explorer.exe`,
`ipconfig.exe`, `nslookup.exe`, and `clip.exe`.

File drops and pasted file lists still use **PowerShell quoting** in Git Bash;
review and adjust them before pressing Enter. To return to Windows PowerShell,
remove `windowsShell`, reload, and open a new tab.

To undo the complete setup, copy your backed-up files to their original
locations, reload, open a new tab, and reopen the sidebar. Remove only example
files you added without replacing an original; keep the rest of your settings
folder. If you manage settings through symlinks, edit your managed source files
instead of replacing links.

<details>
<summary>Optional Git Bash and Vim preferences</summary>

These are separate from OMXTerm settings. Download as above, back up your own
dotfiles, and merge the preferences you want with a text editor:

| Example                          | Usual destination in Git Bash                    |
| -------------------------------- | ------------------------------------------------ |
| [bashrc](files/windows/bashrc)   | `~/.bashrc`                                      |
| [inputrc](files/windows/inputrc) | `~/.inputrc` (or the file selected by `INPUTRC`) |
| [vimrc](files/windows/vimrc)     | `~/.vimrc`                                       |

Use `printf '%s\n' "$HOME"` in Git Bash to find its home folder; it may differ
from PowerShell's `$HOME`.

The examples enable vi-style editing (`Esc` or `jj` leaves insert mode), quiet
bells, and history that skips leading-space commands. Vim uses `slate` colors,
two-space indentation, and `Space w` to save. When started without file arguments,
it saves/loads per-directory sessions under `~/.vim/sessions/`; load only trusted
sessions because they contain executable Vim commands. Clipboard support depends
on your Vim build.

Start a new Git Bash tab or Vim to apply the changes. To undo, restore your
backups (or remove only newly added files) and start a new shell or Vim again.

</details>
