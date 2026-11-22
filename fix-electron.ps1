# Repairs "Electron failed to install correctly" by downloading Electron straight from GitHub.
# Run from the Halo folder after `npm install`:  npm run fix-electron
$ErrorActionPreference = 'Stop'
$dir = Join-Path $PSScriptRoot 'node_modules\electron'
if (-not (Test-Path "$dir\package.json")) { Write-Host 'Run "npm install" first.'; exit 1 }
$ver = (Get-Content "$dir\package.json" -Raw | ConvertFrom-Json).version
$url = "https://github.com/electron/electron/releases/download/v$ver/electron-v$ver-win32-x64.zip"
$zip = Join-Path $env:TEMP "electron-v$ver.zip"
Write-Host "Downloading Electron $ver ..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
(New-Object Net.WebClient).DownloadFile($url, $zip)
$dist = Join-Path $dir 'dist'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $dist -Force
[IO.File]::WriteAllText((Join-Path $dir 'path.txt'), 'electron.exe')
Remove-Item $zip -Force
if (Test-Path (Join-Path $dist 'electron.exe')) { Write-Host 'Done. Now run: npm start' } else { Write-Host 'electron.exe is missing after extraction. If antivirus removed it, add an exclusion for this folder and run again.'; exit 1 }
