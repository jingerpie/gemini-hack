# Restarts the studio server in the background (dev helper). Logs to server/test/out/server.log
$conn = Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
$studio = Resolve-Path "$PSScriptRoot\..\.."
New-Item -ItemType Directory -Force "$PSScriptRoot\out" | Out-Null
Start-Process -FilePath node -ArgumentList "server/index.mjs" -WorkingDirectory $studio -RedirectStandardOutput "$PSScriptRoot\out\server.log" -RedirectStandardError "$PSScriptRoot\out\server.err.log" -WindowStyle Hidden
Start-Sleep -Seconds 2
Get-Content "$PSScriptRoot\out\server.log"
