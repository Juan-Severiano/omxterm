# Linux quick start

[Install OMXTerm](../installation.md#linux) and open it. Your account shell,
bundled font, and colors are ready to use. Try one setting change and a saved
command below, or jump to the [complete example setup](#complete-ready-to-use-setup-optional).

The commands and optional snippets below use Bash. If your shell is different,
type `bash` first and `exit` when finished. This does not change the shell started
by new OMXTerm tabs.

## 1. Open your settings folder

Run this in Bash to print the folder:

```bash
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/omxterm"
mkdir -p "$config_dir"
printf '%s\n' "$config_dir"
```

Open that path in your file manager; **Ctrl+L** accepts a path in many file
managers. The default is `~/.config/omxterm`. If you set `XDG_CONFIG_HOME` before
launching OMXTerm, use its `omxterm` subfolder instead. Changing that variable
inside the shell does not move the running app's settings.

The first launch creates `config.json`, `snippets.json`, and
`themes/omtheme.json` when no configuration exists. An existing `config.json`
keeps your setup and skips that starter kit. For missing files, use the
[minimal configuration](../configuration.md#quick-start-use-the-bundled-defaults),
[snippet example](../configuration.md#snippets), and
[complete theme](../configuration.md#terminal-themes).

Back up files before editing them with a plain-text editor.

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
to your existing array, or use that complete example for a new file.

Open **View → Toggle Snippets** (`Ctrl+Shift+S`). Click the greeting or your chosen
single-line snippet with `execute: false`, review the inserted command, then
press Enter. Close and reopen the sidebar after editing the file.

## 4. Make it yours

- **Colors:** edit the theme selected by `theme.path` and reload, or use
  [OMXTerm Studio](../configuration.md#edit-visually-with-omxterm-studio).
- **Background:** try [transparency and blur](../configuration.md#background-transparency-and-blur).
  For GNOME, KDE Plasma, or Hyprland setup, see [Linux desktop tips](linux-desktop.md).
- **Window bars:** `Ctrl+Shift+D` toggles the title bar; `Ctrl+Shift+B` toggles
  the tab bar. [Set defaults for new windows](../configuration.md#start-with-hidden-bars).
- **Small interface or VM graphics trouble:** see [HiDPI scaling](linux-desktop.md#small-interface-text-on-a-hidpi-display)
  or [graphics troubleshooting](linux-desktop.md#graphics-troubleshooting).

Continue with [everyday use](../usage.md), [shortcuts](../configuration.md#keybinds),
or [when settings take effect](../configuration.md#reloading-user-configuration).

<a id="optional-complete-examples"></a>

## Complete ready-to-use setup (optional)

These three files use bundled fonts and built-in shortcuts. The snippets assume
Bash; the configuration keeps your account shell. Destinations are inside your
[settings folder](#1-open-your-settings-folder):

| Download                                               | Copy to               |
| ------------------------------------------------------ | --------------------- |
| [config.json](files/linux/config.json)                 | `config.json`         |
| [snippets.json](files/linux/snippets.json)             | `snippets.json`       |
| [themes/omtheme.json](files/linux/themes/omtheme.json) | `themes/omtheme.json` |

1. Download each file using GitHub's **Download raw file** button. Alternatively,
   choose **Code → Download ZIP** on the repository's **main** branch, extract
   it, and open `docs/quick-start/files/linux/`.
2. Copy your existing destination files to a separate backup folder first,
   preserving the `themes` subfolder. Keep that backup to undo the changes.
3. Copy the three examples into the destinations above, creating `themes` if
   needed. This replaces your preferences; merge individual fields instead if
   you want to keep other choices.
4. Reload configuration and close/reopen the snippets sidebar.

Try **Go to home directory**: it inserts ` cd "$HOME"`; press Enter to return
home. All seven snippets are single-line and have `execute: false`. Other snippets
use `xdg-open`, `ip`, `nslookup`, `git`, and GNU `base64 -w0`. Install a missing
tool through your distribution or edit the snippet. The palette example uses
Bash syntax.

To undo, copy your backed-up files to their original locations, reload, and
reopen the sidebar. Remove only example files you added without replacing an
original; keep the rest of your settings folder. If you manage settings through symlinks, edit your
managed source files instead of replacing links.

<details>
<summary>Optional Bash and Vim preferences</summary>

These are separate from OMXTerm settings. Download as above, back up your own
dotfiles, and merge the preferences you want with a text editor:

| Example                        | Usual destination                                |
| ------------------------------ | ------------------------------------------------ |
| [bashrc](files/linux/bashrc)   | `~/.bashrc`                                      |
| [inputrc](files/linux/inputrc) | `~/.inputrc` (or the file selected by `INPUTRC`) |
| [vimrc](files/linux/vimrc)     | `~/.vimrc`                                       |

The examples enable vi-style editing (`Esc` or `jj` leaves insert mode), quiet
bells, and history that skips leading-space commands. Vim uses `slate` colors,
two-space indentation, and `Space w` to save. When started without file arguments,
it saves/loads per-directory sessions under `~/.vim/sessions/`; load only trusted
sessions because they contain executable Vim commands. Clipboard support depends
on your Vim build; `unnamed` uses the primary selection on X11.

When Bash is your account shell, OMXTerm starts it as a login shell. Bash reads
the first readable file among `~/.bash_profile`, `~/.bash_login`, and `~/.profile`.
Back up that file too. If it does not already source `.bashrc`, add this block,
keeping its other settings:

```sh
if [ -n "$BASH_VERSION" ] && [ -r "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi
```

If none of those files exists, create `~/.profile` with that block. Creating
`.bash_profile` when `.profile` is in use would bypass the latter's login setup.

Start a new shell or Vim to apply the changes. To undo, restore your backups
(or remove only newly added files) and start a new shell or Vim again.

</details>
