param([string]$ArchiveRoot = 'D:\file\fun\code\ios-png-originals')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$archivePath = [IO.Path]::GetFullPath($ArchiveRoot)
$allowedRoot = [IO.Path]::GetFullPath('D:\file\fun\code') + [IO.Path]::DirectorySeparatorChar
if (-not $archivePath.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase) -or $archivePath.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or $archivePath -eq $projectRoot) {
  throw 'Archive must be outside the project and inside D:\file\fun\code.'
}
$plan = Get-Content -LiteralPath (Join-Path $projectRoot 'png-archive-plan.json') -Raw | ConvertFrom-Json
$state = Get-Content -LiteralPath (Join-Path $projectRoot 'webp-state.json') -Raw | ConvertFrom-Json -AsHashtable
$moves = @()
foreach ($entry in $plan) {
  $sourcePath = [IO.Path]::GetFullPath((Join-Path $projectRoot $entry.relative))
  $targetPath = [IO.Path]::GetFullPath((Join-Path $archivePath $entry.relative))
  if (-not $sourcePath.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or -not $targetPath.StartsWith($archivePath + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Path escaped intended directory.' }
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { throw "Missing original: $sourcePath" }
  if (Test-Path -LiteralPath $targetPath) { throw "Archive collision: $targetPath" }
  if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Original changed: $sourcePath" }
  $webpPath = [IO.Path]::GetFullPath((Join-Path $projectRoot $state[$entry.relative].target))
  if (-not $webpPath.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $webpPath -PathType Leaf)) { throw "Missing converted WebP: $webpPath" }
  $moves += @{ Source = $sourcePath; Target = $targetPath }
}
foreach ($move in $moves) {
  New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($move.Target)) -Force | Out-Null
  Move-Item -LiteralPath $move.Source -Destination $move.Target
}
Write-Output "Moved $($moves.Count) PNG originals to $archivePath"
