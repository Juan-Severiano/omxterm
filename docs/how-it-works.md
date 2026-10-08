# How OMXTerm works

OMXTerm is the desktop window around your command-line work. It gives you tabs,
text rendering, copy/paste, colors, and a few conveniences; your shell and the
programs you launch do the actual work.

This guide explains that relationship and offers a [short demonstration](#a-short-demonstration)
you can follow or use to plan a video. To get started instead, go to
[Installation](installation.md).

## The terminal is not the shell

Three pieces work together:

| Piece                    | Its job                                                   | Example                       |
| ------------------------ | --------------------------------------------------------- | ----------------------------- |
| **OMXTerm**              | Display output and send your input to the running program | Tabs, selection, font zoom    |
| **Shell**                | Read commands, expand arguments, and launch programs      | Zsh, Bash, PowerShell         |
| **Command-line program** | Do the requested work                                     | Git, Vim, SSH, a coding agent |

Type `pwd` and press Enter. OMXTerm sends your input; the shell handles the
command; OMXTerm displays the result. A prompt, aliases, and command history
come from your shell setup, not from OMXTerm's theme.

The same distinction explains remote work and AI tools: running `ssh` connects
through your SSH client, and running a coding agent starts that program.
OMXTerm itself is a local terminal, not an SSH broker or an AI assistant.

## From opening the app to seeing a prompt

1. **Load preferences.** OMXTerm reads `config.json` and the selected theme.
   On a first launch without a configuration, it creates editable starter files.
2. **Create a window and its first tab.** Each tab gets its own terminal display.
3. **Prepare the display.** Fonts and the terminal engine initialize with a
   working WebGL2 graphics backend. The shell starts only after this succeeds.
4. **Start a local session.** OMXTerm connects the tab to a pseudo-terminal, or
   **PTY**: the operating-system connection that lets a shell behave as if it
   were attached to a terminal, with keyboard input, output, and a screen size.
5. **Run the shell in your home folder.** On macOS and Linux, this is your
   account's login shell. On Windows, it is Windows PowerShell by default, or
   the installed executable selected by `windowsShell`.

Your shell loads its own startup preferences. OMXTerm leaves those files to you;
installing a terminal does not replace your `.zshrc`, `.bashrc`, or PowerShell
profile.

## The round trip behind each command

```text
Your keyboard
     │
     ▼
Terminal display → session adapter → Electron main → local PTY → shell/program
     ▲                                                  │
     └──────────── output returns through the same route ┘
```

The **Terminal Surface** is OMXTerm's display-and-input module. It uses Restty,
with Ghostty's terminal core, to interpret terminal output and draw text and
supported inline images through WebGL2. Output includes ordinary characters and
control sequences: instructions for colors, cursor movement, screen clearing,
and other terminal behavior. This is why a full-screen editor can update a
single area instead of printing a new page every time.

The **session adapter** carries input, output, resize, and close operations.
It connects the portable display module to Electron through a small typed
bridge. Electron's **main process** owns native windows, the PTYs, configuration
files, and operating-system actions such as clipboard access and opening links.
The display module does not start native processes directly.

Resizing the window or changing font zoom recalculates how many rows and columns
fit and sends that size to the same session. The shell or editor can then redraw
for the new space.

## Tabs keep separate work running

Each tab has its own shell or launched program, screen, and in-memory scrollback.
Changing folders in one tab does not move another tab. Switching tabs keeps the
hidden session running and collecting output; returning to it shows its current
state. Reordering tabs changes their positions, not their processes.

A few useful boundaries:

- **Tab bar:** appears with two or more tabs; hiding it leaves keyboard navigation
  available.
- **Zoom:** applies to all tabs in the current window, not other windows.
- **Closing:** closing a tab ends its session; closing the last window quits the
  app. By default, OMXTerm asks before closing busy work. Windows asks for every
  live session because it cannot reliably identify an idle shell.
- **Persistence:** OMXTerm does not restore tabs or running sessions after quit.
  Use a session manager such as tmux when you need work to survive a closed tab.

See [Everyday use](usage.md#windows-tabs-and-sessions) for controls and shortcuts.

## Customization is three small files

In the [settings folder](configuration.md#create-the-configuration-directory):

| File                                     | What you change                                                      | How to apply it                       |
| ---------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| `config.json`                            | Font size, spacing, window effects, shortcuts, and other preferences | **View → Reload User Configuration**  |
| `themes/omtheme.json` in the starter kit | Foreground, background, cursor, selection, and ANSI colors           | Reload configuration                  |
| `snippets.json`                          | Named text you can insert into the selected tab                      | Close and reopen the snippets sidebar |

Most appearance settings update existing sessions. Font family and line height
apply to new tabs; restart to apply them everywhere. Window-bar defaults apply
to new windows, while menu toggles change the current one. Theme selection is a
path in `config.json`, so you can keep several files and choose one explicitly.

OMXTerm validates the files and shows actionable errors without rewriting your
preferences. Saving alone does not reload them. The [configuration guide](configuration.md)
explains examples, reload behavior, and errors. [OMXTerm Studio](configuration.md#edit-visually-with-omxterm-studio)
is an optional visual editor: export its files, place them in the settings
folder, and reload.

Transparency affects the terminal background rather than fading the entire
window. Text, selection, and inline images keep their normal opacity. Blur comes
from the operating system or desktop compositor; a program that paints its own
background can remain opaque.

## Conveniences around the session

**Copy and paste:** selecting text does not copy it automatically. Use the Copy
shortcut or menu. Paste, snippets, and dropped-file paths share Protected Paste:
multiline or control-character input asks for confirmation when the receiving
program has not enabled bracketed paste. Review commands before running them.

**Snippets:** click a saved entry to send its body to the selected tab. For
commands you want to review first, use a single-line body without control
characters and `execute: false`, then press Enter yourself. Setting
`execute: true` appends Enter automatically. Newlines inside the body still
matter; that flag controls only the extra Enter.

**File drops:** drop a file or folder to insert its quoted absolute path, without
appending Enter. Quoting follows the platform: POSIX shells on macOS/Linux,
PowerShell on Windows. Check it if you are using a different shell.

**Links and images:** Cmd+click on macOS or Ctrl+click on Linux/Windows opens a
visible web URL in your browser. A local PNG/JPEG path opens a temporary image
preview; **File → Open Local Image…** opens the same preview through a picker.
Relative paths ask you to choose a base folder. These paths refer to the computer
running OMXTerm, even when SSH printed them.

Inline images are different: programs such as Chafa or Pi send supported Kitty
image sequences as terminal output. They stay in the terminal grid rather than
opening a preview. Use a direct session for these images; multiplexer image
passthrough is not supported. See [image setup](usage.md#inline-terminal-images).

## What stays on your computer

Preferences and bounded diagnostic logs are local files. Terminal scrollback and
images stay in memory; OMXTerm does not save a terminal transcript. Your shell
and other programs may save their own history or files.

OMXTerm makes no application network requests. Programs you run retain their
usual network access, and explicitly opened web links go to your browser.
Linux uses X11/XWayland and runs without Chromium's sandbox; macOS and Windows
keep that sandbox enabled. The [installation guide](installation.md) covers
platform requirements and first-launch approval.

## A short demonstration

Start with a roomy window, a harmless local PNG/JPEG, and settings backed up.
Use menu labels when recording so viewers can follow on another platform; on
Linux and Windows, press and release **Alt alone** to open the menu.

1. **Show a normal shell.** Run `pwd` and `echo Hello from OMXTerm`. Explain the
   terminal/shell distinction while the audience sees the round trip.
2. **Open a second tab.** Run a different command there, switch back, and drag
   the tabs to reorder them. Show that each keeps its own output.
3. **Make room.** Zoom in, reset with Actual Size, hide the title/tab bars, and
   bring them back. With the title hidden, show the hover-revealed drag handle.
4. **Change one preference.** Change `font.size` from `16` to `18`, save, and
   reload. The text changes without restarting the shell. Optionally show the
   editable theme or modest transparency.
5. **Use a saved command.** Open Snippets, insert the single-line greeting with
   `execute: false`, and press Enter. Explain that it is reusable text, not a
   separate task runner.
6. **Preview an image.** Use File → Open Local Image, then Escape to return to
   the same tab. If Chafa is installed, contrast it with
   `chafa -f kitty /path/to/image.png` using your real image path.
7. **Close deliberately.** Type `exit` in one shell and show that only its tab
   ends. Explain that persistent work belongs in a tool such as tmux.

For implementation details after the overview, follow the
[product contract](spec.md), [architecture decisions](adr/README.md), or
[contribution guide](../CONTRIBUTING.md).
