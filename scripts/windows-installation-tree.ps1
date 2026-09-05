# NSIS recursively traverses the previous installation during replacement.
# Inspect metadata only; never follow reparse points or infer unreadable absence.
function Assert-OmxtermInstallationTree {
  param([Parameter(Mandatory=$true)][string]$Root, [switch]$RequireBinaries)
  $item = Get-Item -LiteralPath $Root -Force -ErrorAction Stop
  if (!$item.PSIsContainer) { throw 'Unknown installation directory ownership' }
  $ancestor = $item
  while ($null -ne $ancestor) {
    if ($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unknown installation reparse point ownership' }
    $ancestor = $ancestor.Parent
  }
  $pending = New-Object 'Collections.Generic.Stack[string]'
  $pending.Push($Root)
  $count = 0
  while ($pending.Count) {
    $directory = $pending.Pop()
    $current = Get-Item -LiteralPath $directory -Force -ErrorAction Stop
    if ($current.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unknown installation reparse point ownership' }
    foreach ($entry in Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop) {
      $count++
      if ($count -gt 10000) { throw 'Installation inspection exceeds its bounded footprint' }
      if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unknown nested installation reparse point ownership' }
      if ($entry.PSIsContainer) { $pending.Push($entry.FullName) }
    }
  }
  if ($RequireBinaries) {
    foreach ($name in @('OMXTerm.exe', 'Uninstall OMXTerm.exe')) {
      $binary = Get-Item -LiteralPath (Join-Path $Root $name) -Force -ErrorAction Stop
      if ($binary.PSIsContainer -or ($binary.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Registered installation binary ownership is not established' }
    }
  }
}
