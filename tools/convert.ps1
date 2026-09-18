param(
  [string]$Blender = 'F:\SteamLibrary\steamapps\common\Blender\blender.exe',
  [string]$Source = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\推しの子 - アイ _ Oshino Ko - Hoshino Ai')
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath $Blender)) { throw '请使用 -Blender 指定 blender.exe 的路径。' }
$names = @('TEMP','TMP','BLENDER_USER_RESOURCES','PYTHONDONTWRITEBYTECODE')
$saved = @{}
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
try {
  $env:TEMP = Join-Path $root '.cache\temp'; $env:TMP = $env:TEMP
  $env:BLENDER_USER_RESOURCES = Join-Path $root '.cache\blender'
  $env:PYTHONDONTWRITEBYTECODE = '1'
  New-Item -ItemType Directory -Force -Path $env:TEMP,$env:BLENDER_USER_RESOURCES | Out-Null
  & $Blender --background --factory-startup --python-exit-code 1 --python (Join-Path $PSScriptRoot 'build-model.py') -- $Source
  if ($LASTEXITCODE -ne 0) { throw 'Blender conversion failed' }
} finally {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$saved[$name],'Process') }
}
