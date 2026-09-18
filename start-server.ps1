param([int]$Port = 8010)
& node (Join-Path $PSScriptRoot 'server.mjs') $Port
