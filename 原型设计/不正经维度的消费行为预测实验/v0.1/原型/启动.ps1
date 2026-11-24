param(
    [switch]$TokenDance,
    [int]$Port = 47623
)

$ErrorActionPreference = 'Stop'
$brandtopiaOriginalMode = $env:BRANDTOPIA_MODE
$brandtopiaOriginalPort = $env:BRANDTOPIA_PORT
$brandtopiaReadKey = $false

try {
    $env:BRANDTOPIA_PORT = [string]$Port
    $env:BRANDTOPIA_MODE = if ($TokenDance) { 'tokendance' } else { 'demo' }
    if ($TokenDance -and -not $env:TOKENDANCE_API_KEY) {
        $brandtopiaSecureKey = Read-Host '请输入 TokenDance 的完整 API Key' -AsSecureString
        $env:TOKENDANCE_API_KEY = [Net.NetworkCredential]::new('', $brandtopiaSecureKey).Password
        $brandtopiaSecureKey.Dispose()
        $brandtopiaReadKey = $true
    }
    node (Join-Path $PSScriptRoot 'server.mjs')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    $env:BRANDTOPIA_MODE = $brandtopiaOriginalMode
    $env:BRANDTOPIA_PORT = $brandtopiaOriginalPort
    if ($brandtopiaReadKey) { Remove-Item Env:TOKENDANCE_API_KEY -ErrorAction SilentlyContinue }
}
