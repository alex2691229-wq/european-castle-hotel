param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$FilePath = "client/public/hotel_exterior_day.jpeg"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $FilePath)) {
  Write-Error "Test image not found: $FilePath"
}

Write-Host "[1/2] Checking API status: $BaseUrl/api/status"
$statusResp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/status"
$statusResp | ConvertTo-Json -Depth 5

Write-Host "[2/2] Uploading image: $FilePath -> $BaseUrl/api/upload"
$raw = curl.exe -s -X POST "$BaseUrl/api/upload" -F "file=@$FilePath"
$uploadResp = $raw | ConvertFrom-Json
$uploadResp | ConvertTo-Json -Depth 8

if ($uploadResp.success -ne $true) {
  Write-Error "Upload failed. See response above."
}

Write-Host "Upload check passed."
