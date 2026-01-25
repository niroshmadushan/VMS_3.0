# Development Workflow Guide

This project uses a two-branch workflow:
- **`development`** - For ongoing development work
- **`main`** - For production-ready code (hosting)

## Branch Structure

```
main (production) ←─── development (dev work)
```

## Quick Start

### Daily Development Work

1. **Work on development branch:**
   ```bash
   git checkout development
   git pull origin development
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: Your feature description"
   git push origin development
   ```

### Deploy to Production

When you're ready to deploy your development changes to production:

#### Option 1: Use the Complete Workflow Script (Recommended)

**Windows:**
```bash
npm run workflow
```

**Linux/Mac:**
```bash
npm run workflow
```

This will:
1. Merge `development` → `main`
2. Build production version
3. Switch you back to `development` branch

#### Option 2: Manual Steps

**Step 1: Merge to Production**
```bash
npm run merge:production
```

**Step 2: Build Production**
```bash
npm run build:production
```

#### Option 3: Use Scripts Directly

**Windows:**
```bash
scripts\dev-workflow.bat
```

**Linux/Mac:**
```bash
bash scripts/dev-workflow.sh
```

## Available Scripts

### NPM Scripts (Cross-platform)

- `npm run merge:production` - Merge development branch to main
- `npm run build:production` - Build production version (must be on main branch)
- `npm run workflow` - Complete workflow: merge + build

### Direct Scripts

**Windows (.bat files):**
- `scripts\merge-to-production.bat` - Merge dev to main
- `scripts\build-production.bat` - Build production
- `scripts\dev-workflow.bat` - Complete workflow

**Linux/Mac (.sh files):**
- `scripts/merge-to-production.sh` - Merge dev to main
- `scripts/build-production.sh` - Build production
- `scripts/dev-workflow.sh` - Complete workflow

**Node.js (Cross-platform):**
- `scripts/merge-to-production.js` - Merge dev to main
- `scripts/build-production.js` - Build production
- `scripts/dev-workflow.js` - Complete workflow

## Workflow Details

### Merge to Production Process

1. Checks you're on `development` branch
2. Fetches latest changes
3. Switches to `main` branch
4. Pulls latest `main`
5. Merges `development` into `main` (no fast-forward)
6. Pushes `main` to remote
7. Switches back to `development`

### Build Production Process

1. Checks you're on `main` branch (with warning if not)
2. Fetches latest changes
3. Pulls latest code
4. Installs dependencies (`npm install`)
5. Builds production version (`npm run build`)

## Important Notes

⚠️ **Always work on `development` branch for new features**

⚠️ **Only merge to `main` when code is ready for production**

⚠️ **The build output is in `.next` folder - deploy this to your hosting platform**

## Troubleshooting

### Merge Conflicts

If you get merge conflicts:
1. Resolve conflicts manually
2. Stage resolved files: `git add .`
3. Complete merge: `git commit`
4. Continue with push

### Build Failures

If build fails:
1. Check for TypeScript errors: `npm run lint`
2. Fix any errors
3. Try building again: `npm run build:production`

### Wrong Branch

If you're on the wrong branch:
- For development work: `git checkout development`
- For production build: `git checkout main`

## Deployment

After building production:

1. The `.next` folder contains the production build
2. Deploy this to your hosting platform (Vercel, Netlify, etc.)
3. Or run locally: `npm run start`

## Git Commands Reference

```bash
# Check current branch
git branch --show-current

# Switch to development
git checkout development

# Switch to main
git checkout main

# View all branches
git branch -a

# View commit history
git log --oneline --graph --all
```











