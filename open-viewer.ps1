param([int]$Port = 8010)
$ErrorActionPreference = 'Stop'
$profile = Join-Path $PSScriptRoot '.cache\viewer-browser'
$tempDir = Join-Path $PSScriptRoot '.cache\temp'
New-Item -ItemType Directory -Force -Path $profile,$tempDir | Out-Null
$savedTemp=$env:TEMP; $savedTmp=$env:TMP
try {
  $env:TEMP=$tempDir; $env:TMP=$tempDir
  # Visible window is intentional: this script is the user's interactive viewer.
  Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--user-data-dir="'+$profile+'"','--disk-cache-dir="'+(Join-Path $profile 'disk-cache')+'"','--no-first-run','--disable-background-networking',"http://127.0.0.1:$Port/")
} finally { $env:TEMP=$savedTemp; $env:TMP=$savedTmp }
