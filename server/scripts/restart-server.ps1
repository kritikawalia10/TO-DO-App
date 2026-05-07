Param(
    [int]$Port = 4000
)

Write-Host "Restarting server on port $Port..."

# Find process(es) owning the TCP connection on the port (Windows)
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        Write-Host "Stopping process $pid"
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
        } catch {
            Write-Warning "Could not stop process $pid: $_"
        }
    }
} else {
    Write-Host "No process found listening on port $Port"
}

# Start the dev server in a new PowerShell window so the current terminal isn't blocked
Write-Host "Starting 'npm run dev' in a new PowerShell window..."
$pwd = Get-Location
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd '$pwd'; npm run dev" -WorkingDirectory $pwd
