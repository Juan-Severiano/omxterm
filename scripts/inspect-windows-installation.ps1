param([Parameter(Mandatory=$true)][string]$Guid)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
# Read-only. Missing is distinct from denied, malformed, or failed inspection.
try {
  if ($Guid -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') { throw 'Unknown installer identity' }
  $registrations = @()
  foreach ($hive in @('CurrentUser', 'LocalMachine')) {
    foreach ($view in @('Registry32', 'Registry64')) {
      $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::$hive, [Microsoft.Win32.RegistryView]::$view)
      try {
        foreach ($entry in @(@{kind='install';key="Software\$Guid"}, @{kind='uninstall';key="Software\Microsoft\Windows\CurrentVersion\Uninstall\$Guid"})) {
          $key = $base.OpenSubKey($entry.key, $false)
          if ($null -eq $key) { continue }
          try {
            $registrations += @{
              hive=$hive; view=$view; kind=$entry.kind
              location=$key.GetValue('InstallLocation', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
              uninstall=$key.GetValue('UninstallString', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
              shortcut=$key.GetValue('ShortcutName', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
              menu=$key.GetValue('MenuDirectory', $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
            }
          } finally { $key.Dispose() }
        }
      } finally { $base.Dispose() }
    }
  }
  $paths = @()
  foreach ($folder in @('LocalApplicationData', 'ProgramFiles', 'ProgramFilesX86', 'Programs', 'CommonPrograms', 'DesktopDirectory', 'CommonDesktopDirectory')) {
    $root = [Environment]::GetFolderPath([Environment+SpecialFolder]::$folder)
    if ([string]::IsNullOrWhiteSpace($root)) { throw 'Unknown Windows special folder' }
    $suffix = switch ($folder) {
      'LocalApplicationData' { 'Programs\omxterm' }
      'ProgramFiles' { 'OMXTerm' }
      'ProgramFilesX86' { 'OMXTerm' }
      default { 'OMXTerm.lnk' }
    }
    $target = Join-Path $root $suffix
    # Get-Item distinguishes absent entries from access/inspection errors.
    try {
      $item = Get-Item -LiteralPath $target -Force
      if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unknown reparse point ownership' }
      $kind = if ($suffix -eq 'OMXTerm.lnk') { 'shortcut' } else { 'install' }
      $scope = if ($folder -in @('LocalApplicationData', 'Programs', 'DesktopDirectory')) { 'user' } else { 'machine' }
      $destination = $null
      if ($kind -eq 'shortcut') {
        # Opening an existing link and reading TargetPath does not save/change it.
        $shell = New-Object -ComObject WScript.Shell
        $link = $shell.CreateShortcut($target)
        try { $destination = $link.TargetPath } finally {
          $null = [Runtime.InteropServices.Marshal]::FinalReleaseComObject($link)
          $null = [Runtime.InteropServices.Marshal]::FinalReleaseComObject($shell)
        }
      }
      $paths += @{ path=$target; kind=$kind; scope=$scope; target=$destination }
    } catch [System.Management.Automation.ItemNotFoundException] { }
  }
  $processes = @(Get-CimInstance -ClassName Win32_Process -ErrorAction Stop | Where-Object { $_.Name -match '^(OMXTerm(?:-.*)?|Uninstall OMXTerm|Au_.*)\.exe$' }).Count -gt 0
  @{ registrations=@($registrations); paths=@($paths); processes=$processes } | ConvertTo-Json -Depth 5 -Compress
} catch {
  # Do not serialize registry values, command lines, or user paths on failure.
  [Console]::Error.WriteLine('Windows installation inspection failed; no absence established.')
  exit 1
}
