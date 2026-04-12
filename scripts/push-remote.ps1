# Применяет все миграции из supabase/migrations к облачной базе Supabase.
# Нужна строка подключения Postgres (не anon key).
#
# Где взять URI: Supabase Dashboard → Project Settings → Database → Connection string → URI
# Формат: postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
#    или: postgresql://postgres:[YOUR-PASSWORD]@db.[ref].supabase.co:5432/postgres
#
# Запуск (PowerShell):
#   $env:DATABASE_URL = "postgresql://postgres:ПАРОЛЬ@db.xxxxx.supabase.co:5432/postgres"
#   .\scripts\push-remote.ps1

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL -or $env:DATABASE_URL.Trim() -eq "") {
  Write-Host "Задайте переменную окружения DATABASE_URL (URI базы из Supabase Dashboard)." -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Применяю миграции к удалённой базе..." -ForegroundColor Cyan
npx supabase db push --db-url $env:DATABASE_URL --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Готово." -ForegroundColor Green
