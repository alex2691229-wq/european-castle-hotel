param(
  [string]$BaseUrl = "",
  [string]$FilePath = "client/public/hotel_exterior_day.jpeg"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $FilePath)) {
  Write-Error "Test image not found: $FilePath"
}

$candidates = @()
if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
  $candidates = @("http://localhost:3000", "http://localhost:3001")
} else {
  $candidates = @($BaseUrl)
}

$errors = @()
foreach ($candidate in $candidates) {
  try {
    Write-Host "[1/2] Checking API status: $candidate/api/status"
    $statusResp = Invoke-RestMethod -Method Get -Uri "$candidate/api/status" -TimeoutSec 3
    $statusResp | ConvertTo-Json -Depth 5

    Write-Host "[2/2] Uploading image: $FilePath -> $candidate/api/upload"
    $raw = curl.exe -s -X POST "$candidate/api/upload" -F "file=@$FilePath"
    $uploadResp = $raw | ConvertFrom-Json
    $uploadResp | ConvertTo-Json -Depth 8

    if ($uploadResp.success -eq $true) {
      Write-Host "Upload check passed on $candidate."
      exit 0
    }

    $msg = if ($uploadResp.error) { $uploadResp.error } else { "Unknown upload error" }
    $errors += "${candidate}: ${msg}"
  } catch {
    $errors += "${candidate}: $($_.Exception.Message)"
  }
}

Write-Error ("Upload failed on all candidates. " + ($errors -join " | "))
