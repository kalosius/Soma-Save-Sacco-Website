#!/usr/bin/env pwsh
# Quick deployment script for Windows PowerShell

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "SomaSave SACCO - Deploy Password Reset Fix" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if in correct directory
if (-Not (Test-Path "backend\manage.py")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Expected: c:\Users\user\Desktop\somasavewebsite" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ In correct directory`n" -ForegroundColor Green

# Show what will be committed
Write-Host "📋 Changes to be committed:" -ForegroundColor Cyan
Write-Host "  - Fixed password reset email sending" -ForegroundColor White
Write-Host "  - Added Resend API integration for Railway" -ForegroundColor White
Write-Host "  - Improved error handling and logging" -ForegroundColor White
Write-Host "  - Created deployment guides" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Do you want to commit and push these changes? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Git add
Write-Host "`n📦 Staging changes..." -ForegroundColor Cyan
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git add failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes staged`n" -ForegroundColor Green

# Git commit
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
$commitMessage = "fix: Password reset email with Resend API for Railway

- Replace async email sending with synchronous Resend API
- Add auto-detection for Resend API key
- Improve error handling with specific error messages
- Add comprehensive logging for debugging
- Create deployment guides and test scripts
- Update settings for Railway compatibility

This fixes the email sending issue on Railway where SMTP ports are blocked.
Users can now reset passwords successfully in production."

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Changes committed`n" -ForegroundColor Green

# Git push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed" -ForegroundColor Red
    Write-Host "   Try: git push origin main --force (if safe)" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📋 Next Steps:`n" -ForegroundColor Cyan

Write-Host "1. Add Resend API Key to Railway:" -ForegroundColor White
Write-Host "   - Go to: https://resend.com/api-keys" -ForegroundColor Gray
Write-Host "   - Create API key" -ForegroundColor Gray
Write-Host "   - Add to Railway Variables: RESEND_API_KEY=re_your_key" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Set Railway Variables:" -ForegroundColor White
Write-Host "   - USE_RESEND=True" -ForegroundColor Gray
Write-Host "   - DEFAULT_FROM_EMAIL=SomaSave SACCO <onboarding@resend.dev>" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL=https://somasave.com" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Railway will auto-deploy (check Deployments tab)" -ForegroundColor White
Write-Host ""

Write-Host "4. Test password reset at:" -ForegroundColor White
Write-Host "   https://somasave.com/forgot-password" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Monitor logs:" -ForegroundColor White
Write-Host "   railway logs --follow" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - backend/FINAL_FIX_SUMMARY.md - Complete overview" -ForegroundColor Gray
Write-Host "   - backend/RAILWAY_QUICK_SETUP.md - Quick reference" -ForegroundColor Gray
Write-Host "   - backend/RAILWAY_DEPLOYMENT_GUIDE.md - Detailed guide" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================`n" -ForegroundColor Green
