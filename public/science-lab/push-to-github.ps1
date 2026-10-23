# Automated Git Push Script for Science Lab Project
$repoUrl = "https://github.com/AabhaRajurkar/Science-Lab.git"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Pushing Science Lab Project to GitHub" -ForegroundColor Green
Write-Host "Repo: $repoUrl" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if git is available in standard locations
$gitExe = $null
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitExe = "git"
} else {
    $paths = @(
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) {
            $gitExe = $p
            $env:Path += ";" + (Split-Path $p -Parent)
            break
        }
    }
}

if (-not $gitExe) {
    Write-Host "Git is not yet installed on this computer." -ForegroundColor Yellow
    Write-Host "Please download installer from: https://git-scm.com/download/win" -ForegroundColor White
    exit 1
}

Write-Host "1. Initializing Git repository..." -ForegroundColor Cyan
& $gitExe init

Write-Host "2. Staging all project files..." -ForegroundColor Cyan
& $gitExe add -A

Write-Host "3. Creating commit..." -ForegroundColor Cyan
& $gitExe commit -m "feat: complete Science Lab 3D educational game"

Write-Host "4. Setting branch to main..." -ForegroundColor Cyan
& $gitExe branch -M main

Write-Host "5. Configuring remote origin..." -ForegroundColor Cyan
& $gitExe remote remove origin 2>$null
& $gitExe remote add origin $repoUrl

Write-Host "6. Pushing to GitHub..." -ForegroundColor Green
& $gitExe push -u origin main

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Project successfully pushed to: $repoUrl" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
