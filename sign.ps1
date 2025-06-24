# sign.ps1 - Generate signature for latest MSI after build

# Use TAURI_SIGNING_PRIVATE_KEY env variable if set, else default path
$privateKey = $env:TAURI_SIGNING_PRIVATE_KEY
# Path to MSI(s)
$msiPattern = "$PSScriptRoot\src-tauri\target\release\bundle\msi\BBMLabelExplorer_*.msi"
# Get the application version from Cargo.toml
$cargoToml = Get-Content "$PSScriptRoot\src-tauri\Cargo.toml" -Raw
$versionMatch = [regex]::Match($cargoToml, 'version\s*=\s*"([^"]+)"')
$version = $versionMatch.Groups[1].Value
Write-Host "Creating signature for version $version..." -ForegroundColor Yellow

# Find the latest MSI file
$msi = Get-ChildItem -Path $msiPattern | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($null -eq $msi) {
    Write-Host "No MSI file found at $msiPattern" -ForegroundColor Red
    exit 1
}

Write-Host "Signing MSI: $($msi.FullName) using private key: $privateKey" -ForegroundColor Cyan

# Run Tauri signer and capture all output lines
$npx = if (Get-Command npx -ErrorAction SilentlyContinue) { 'npx' } else { 'npx.cmd' }

$signResultLines = & $npx tauri signer sign --private-key $privateKey $msi.FullName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Signature generated successfully:" -ForegroundColor Green
    # Extract the actual signature (the line after 'Public signature:')
    $signatureIndex = $signResultLines.IndexOf('Public signature:')
    if ($signatureIndex -ge 0 -and ($signatureIndex + 1) -lt $signResultLines.Count) {
        $signature = $signResultLines[$signatureIndex + 1]
    } else {
        Write-Host "Could not extract signature from signer output." -ForegroundColor Red
        exit 1
    }
    Write-Host $signature
    # Build latest.json
    $version = $version
    $notes = "Bug fixes and improvements."
    $pub_date = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    $msiName = $msi.Name
    $msiUrl = "https://github.com/YOUR_GITHUB_USERNAME/AILabelAssist/releases/download/v$version/$msiName"
    $latestObj = [ordered]@{
        version = $version
        notes = $notes
        pub_date = $pub_date
        platforms = [ordered]@{
            "windows-x86_64" = [ordered]@{
                signature = $signature
                url = $msiUrl
            }
        }
    }
    $jsonPath = Join-Path $msi.Directory.FullName 'latest.json'
    $latestObj | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Host "latest.json created at $jsonPath" -ForegroundColor Green
} else {
    Write-Host "Failed to generate signature." -ForegroundColor Red
    exit 1
}
