# GitHub Setup & Backup Instructions

**MobCheck Repository Setup**

This guide will help you push the MobCheck project to GitHub and create a backup zip file.

---

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `mobCheck`
3. **Description:** "Mobile phone marketplace and professional inspection platform"
4. **Visibility:** Public (or Private if preferred)
5. **Initialize repository:** Do NOT check "Add a README" (we have one)
6. Click **Create repository**

### Option B: Using GitHub CLI

```bash
gh repo create mobCheck --public --source=. --remote=origin --push
```

---

## Step 2: Configure Git Remote

```bash
cd C:\Users\fahad\Desktop\MobCheck

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/mobCheck.git

# Verify
git remote -v
```

---

## Step 3: Push Code to GitHub

### First Push (All Branches)

```bash
# Ensure you're on main/master
git branch -M main

# Push all commits
git push -u origin main
```

### Verify Push Success

```bash
git log --oneline
# Should show:
# 41b310f Phase 3: MVP Development foundation
# 7d22dd3 Add Phase 2 completion summary
# 18a3c06 Phase 2: Database architecture
# 82fb82f Initial MobCheck repository setup
```

---

## Step 4: Create Backup ZIP File

### Option A: Windows PowerShell (Recommended)

```powershell
# Navigate to Desktop
cd $env:USERPROFILE\Desktop

# Create zip with timestamp
$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
Compress-Archive -Path "MobCheck" -DestinationPath "mobCheck-backup-$timestamp.zip" -Force

# Verify creation
Get-ChildItem -Filter "mobCheck-backup-*.zip" | Select-Object Name, Length
```

### Option B: Command Prompt (Windows)

```cmd
cd %USERPROFILE%\Desktop

REM Using tar (Windows 10+)
tar -czf mobCheck-backup.tar.gz MobCheck

REM Or using 7-Zip if installed
7z a mobCheck-backup.zip MobCheck
```

### Option C: PowerShell Script

Create a file `backup.ps1`:

```powershell
# backup.ps1
$backupPath = "$env:USERPROFILE\Desktop\mobCheck-backup-$(Get-Date -Format 'yyyy-MM-dd').zip"

# Remove old backups (keep last 5)
$oldBackups = Get-ChildItem -Filter "mobCheck-backup-*.zip" -Path "$env:USERPROFILE\Desktop" | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 5

$oldBackups | Remove-Item -Force

# Create new backup
Compress-Archive -Path "$env:USERPROFILE\Desktop\MobCheck" -DestinationPath $backupPath -Force

Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
Write-Host "Size: $('{0:N2}' -f ((Get-Item $backupPath).Length / 1MB)) MB" -ForegroundColor Green
```

Run with:
```powershell
powershell -ExecutionPolicy Bypass -File backup.ps1
```

---

## Step 5: Upload ZIP to GitHub Releases

### Using GitHub Web Interface

1. Go to your repository: `https://github.com/YOUR_USERNAME/mobCheck`
2. Click **Releases** (or create one)
3. Click **Create a new release**
4. **Tag version:** `v0.1.0-mvp`
5. **Release title:** `MVP Foundation - Phase 3 Complete`
6. **Description:**
   ```
   ## MobCheck MVP Foundation
   
   Complete Phase 3 MVP development with:
   - 11+ REST API endpoints
   - Authentication system (JWT, bcrypt)
   - Database schema (25+ Prisma models)
   - Shop registration & subscription system
   - Inspection booking system
   - Payment integration (webhook-ready)
   - Review & rating system
   - Admin dashboard
   
   ### Setup
   See README.md for setup instructions
   
   ### Status
   - Phase 1: Foundation ✅
   - Phase 2: Database Design ✅
   - Phase 3: MVP Development Foundation ✅
   - Phase 4: Advanced Features (In Progress)
   
   Ready for local deployment and further development.
   ```
7. Upload the ZIP file as an attachment
8. Click **Publish release**

### Using GitHub CLI

```bash
# Create release with zip upload
gh release create v0.1.0-mvp \
  --title "MVP Foundation - Phase 3 Complete" \
  --notes "Complete MVP foundation with API routes, auth, database integration, and payment system" \
  ./mobCheck-backup-*.zip
```

---

## Step 6: Verify Everything

### Check GitHub Repository

```bash
# View remote
git remote -v

# View commits on GitHub
git log --oneline -5

# Check repository at: https://github.com/YOUR_USERNAME/mobCheck
```

### Verify ZIP File

```powershell
# List backups
Get-ChildItem -Filter "mobCheck-backup-*.zip" -Path "$env:USERPROFILE\Desktop"

# Test zip integrity
Expand-Archive -Path "mobCheck-backup-*.zip" -DestinationPath "$env:TEMP\mobCheck-test" -Force
Get-ChildItem -Path "$env:TEMP\mobCheck-test\MobCheck" -Recurse | Measure-Object | Select-Object Count
```

---

## Git Workflow Going Forward

### After Making Changes

```bash
# Add changes
git add .

# Commit with meaningful message
git commit -m "Feature: [description]"

# Push to GitHub
git push origin main
```

### Pull Latest from GitHub

```bash
git pull origin main
```

### Create Feature Branch

```bash
# Create branch
git checkout -b feature/inspection-checklists

# Make changes and commit
git add .
git commit -m "Add inspection checklist implementation"

# Push branch
git push origin feature/inspection-checklists

# Create Pull Request on GitHub
# Then merge to main
```

---

## Project Structure in GitHub

Your repository will have this structure:

```
mobCheck/
├── apps/
│   └── web/                  # Next.js application
│       ├── src/
│       │   ├── pages/api/   # 11+ API routes
│       │   └── lib/         # Utilities
│       ├── package.json
│       ├── README.md
│       └── ...
│
├── packages/
│   └── database/             # Prisma database
│       ├── prisma/
│       │   ├── schema.prisma # 25+ models
│       │   └── seed.ts
│       ├── package.json
│       └── README.md
│
├── docs/                      # Documentation
│   ├── 01_BRD.md
│   ├── 02_PRD.md
│   ├── 11_DATABASE.md
│   └── ...
│
├── README.md                  # Project overview
├── PHASE3_STATUS.md           # Current phase summary
├── package.json               # Monorepo root
├── tsconfig.json
├── turbo.json
└── ...
```

---

## Troubleshooting

### "fatal: remote origin already exists"

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/mobCheck.git
```

### Authentication Failed

```bash
# Use GitHub token instead of password
# 1. Create PAT at https://github.com/settings/tokens
# 2. Use PAT when prompted for password
# Or configure git credential:
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Large File Warning

The project is small enough for GitHub. If you get warnings:

```bash
# Check file sizes
du -sh .

# Should be under 50MB
```

### ZIP File Too Large

If backup exceeds size limits:

```bash
# Exclude node_modules
$exclude = @("node_modules", ".next", "dist", "build", ".git\objects")
Compress-Archive -Path "MobCheck" -DestinationPath "mobCheck-backup-slim.zip" -Force
```

---

## Security Notes

### Never Commit

- ❌ `.env.local` with real API keys
- ❌ Database passwords
- ❌ Payment gateway secrets
- ❌ Authentication tokens

**Protected Files:**
- Create `.env.local` from `.env.example`
- Add to `.gitignore` (already done)

### GitHub Repository Settings

1. Go to **Settings** → **Branches**
2. Set **main** as default branch
3. Enable **Require pull request reviews** (optional)
4. Enable **Require status checks to pass**

---

## Next Steps After GitHub Setup

### For Collaboration

1. **Clone on another machine:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/mobCheck.git
   cd mobCheck
   npm install
   ```

2. **Keep backup updated:**
   ```bash
   # Create monthly backups
   PowerShell -File backup.ps1
   ```

3. **Monitor repository:**
   - Watch commits
   - Track GitHub issues
   - Use GitHub discussions

### For CI/CD (Optional)

GitHub Actions workflows can automatically:
- Run tests on push
- Build the project
- Deploy to staging

See `.github/workflows/` examples in advanced phase.

---

## Final Checklist

- [ ] GitHub repository created
- [ ] Git remote configured
- [ ] Code pushed to GitHub
- [ ] Backup ZIP created
- [ ] ZIP uploaded to releases
- [ ] Repository verified
- [ ] Credentials secured (.env.local ignored)
- [ ] Clone test passed

---

## Support

For issues with GitHub:
- [GitHub Docs](https://docs.github.com)
- [GitHub CLI Help](https://cli.github.com/manual/)
- Stack Overflow tag: `github`

---

**Repository URL:** `https://github.com/YOUR_USERNAME/mobCheck`

Replace `YOUR_USERNAME` with your actual GitHub username.

---

*All code committed locally and ready for GitHub push. Backup ZIP creation ready.*
