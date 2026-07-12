param(
  [string]$ProjectRef = "",
  [string]$DatabaseUrl = "",
  [string]$OutputDir = (Join-Path $PSScriptRoot "..\supabase\export"),
  [string]$PgDumpPath = ""
)

$ErrorActionPreference = 'Stop'

function Get-PgDumpPath {
  param([string]$ProvidedPath)

  if ($ProvidedPath -and (Test-Path $ProvidedPath)) {
    return (Resolve-Path $ProvidedPath).Path
  }

  $candidates = @(
    'pg_dump.exe',
    'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe',
    'C:\Program Files\PostgreSQL\16\bin\pg_dump.exe',
    'C:\Program Files\PostgreSQL\15\bin\pg_dump.exe'
  )

  foreach ($candidate in $candidates) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }

    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  throw "pg_dump topilmadi. PostgreSQL client o'rnatilganini va PATH ga qo'shilganini tekshiring."
}

function Get-ProjectRef {
  param([string]$ProvidedProjectRef)

  if ($ProvidedProjectRef) {
    return $ProvidedProjectRef
  }

  $envFile = Join-Path $PSScriptRoot '..\.env'
  if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    $match = [regex]::Match($envContent, 'VITE_SUPABASE_PROJECT_ID\s*=\s*"?([^"\r\n]+)"?')
    if ($match.Success) {
      return $match.Groups[1].Value.Trim()
    }
  }

  throw "Project ref topilmadi. -ProjectRef parametrini bering yoki .env faylida VITE_SUPABASE_PROJECT_ID ni saqlang."
}

function ConvertTo-PlainText([securestring]$SecureString) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

$pgDump = Get-PgDumpPath -ProvidedPath $PgDumpPath
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$dbUrlValue = $DatabaseUrl
if (-not $dbUrlValue) {
  $projectRefValue = Get-ProjectRef -ProvidedProjectRef $ProjectRef
  $passwordSecure = Read-Host 'Supabase database password' -AsSecureString
  $password = ConvertTo-PlainText $passwordSecure
  $encodedPassword = [System.Uri]::EscapeDataString($password)
  $dbUrlValue = "postgresql://postgres:$encodedPassword@db.$projectRefValue.supabase.co:5432/postgres?sslmode=require"
}

try {
  $fullPath = Join-Path $OutputDir 'full.sql'
  $schemaPath = Join-Path $OutputDir 'schema.sql'
  $dataPath = Join-Path $OutputDir 'data.sql'

  $baseArgs = @(
    "--dbname=$dbUrlValue",
    '--no-owner',
    '--no-privileges',
    '--no-comments'
  )

  & $pgDump @baseArgs '--format=plain' '--file' $fullPath
  if ($LASTEXITCODE -ne 0) { throw "full.sql export failed with exit code $LASTEXITCODE" }

  & $pgDump @baseArgs '--schema-only' '--file' $schemaPath
  if ($LASTEXITCODE -ne 0) { throw "schema.sql export failed with exit code $LASTEXITCODE" }

  & $pgDump @baseArgs '--data-only' '--file' $dataPath
  if ($LASTEXITCODE -ne 0) { throw "data.sql export failed with exit code $LASTEXITCODE" }

  Write-Host "Export tugadi: $OutputDir"
  Write-Host 'Natijalar: full.sql, schema.sql, data.sql'
} finally {
  $password = $null
  Remove-Variable passwordSecure -ErrorAction SilentlyContinue
}