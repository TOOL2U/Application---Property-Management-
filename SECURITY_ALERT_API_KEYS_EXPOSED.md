# 🚨 SECURITY ALERT: API Keys Exposed in Git History

**Date:** January 6, 2026  
**Severity:** CRITICAL  
**Status:** ⚠️ REQUIRES IMMEDIATE ACTION

---

## Issue Summary

GitHub Secret Scanning has detected exposed Google API keys in the git history of `TOOL2U/Application---Property-Management-`.

### Detected Keys

Multiple Google API keys found in git history:

1. **AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA**
   - First appeared: Commit 63f6fa9 (Jan 6, 2026)
   - Location: `check-cleaner-profile.js`
   - Status: ⚠️ EXPOSED IN PUBLIC HISTORY

2. **AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw**
   - First appeared: Multiple commits (July 2025)
   - Locations: Multiple files
   - Status: ⚠️ EXPOSED IN PUBLIC HISTORY

3. **AIzaSyAuE_a_a5TfQYx2hUYu4Lx2Q-BwwEUdGSE**
   - First appeared: Commit 54b2b07 (July 20, 2025)
   - Status: ⚠️ EXPOSED IN PUBLIC HISTORY

### Impact

- ✅ Keys are likely in `.env.local` (properly protected)
- ⚠️ Keys were committed to git history in archived debug scripts
- ⚠️ Anyone with read access can view these keys
- ⚠️ Keys can be used to access Google Cloud services
- ⚠️ Potential for unauthorized API usage and billing

---

## IMMEDIATE ACTION REQUIRED

### Step 1: Rotate API Keys ⚠️ DO THIS FIRST

**Go to Google Cloud Console immediately:**

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find each exposed key:
   - `AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA`
   - `AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw`
   - `AIzaSyAuE_a_a5TfQYx2hUYu4Lx2Q-BwwEUdGSE`
5. **Delete** or **Regenerate** each key
6. Create new API keys
7. Update `.env.local` with new keys
8. **DO NOT commit new keys to git**

**Environment Variables to Update:**
```bash
# In .env.local (NOT in git)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<NEW_KEY_HERE>
```

---

### Step 2: Remove Keys from Git History

The keys are baked into git history and need to be completely removed.

#### Option A: BFG Repo-Cleaner (RECOMMENDED - Faster)

```bash
# Install BFG (macOS)
brew install bfg

# Create a file with the exposed keys
cat > api-keys-to-remove.txt << 'EOF'
AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA
AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw
AIzaSyAuE_a_a5TfQYx2hUYu4Lx2Q-BwwEUdGSE
EOF

# Clone a fresh copy
cd ~/Desktop
git clone --mirror https://github.com/TOOL2U/Application---Property-Management-.git

# Run BFG to remove the keys
bfg --replace-text api-keys-to-remove.txt Application---Property-Management-.git

# Cleanup and force push
cd Application---Property-Management-.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to rewrite history
git push --force
```

#### Option B: Git Filter-Branch (Alternative)

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch check-cleaner-profile.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
git push origin --force --tags
```

---

### Step 3: Verify Keys Are Environment Variables

Check that all API keys come from environment variables:

```bash
# Search for hardcoded API keys in current code
grep -r "AIza" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v ".git"
```

**Expected Result:** Should only find references to `process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

---

### Step 4: Update .gitignore

Ensure `.env.local` and sensitive files are ignored:

```bash
# Check .gitignore
cat .gitignore | grep -E "(\.env|api-keys)"
```

**Should contain:**
```
.env.local
.env.*.local
*.key
*-key.json
```

---

### Step 5: Team Notification

Notify all team members:

1. **DO NOT** pull from the old history
2. Delete local clones
3. Re-clone after history rewrite
4. Update `.env.local` with new API keys
5. Never commit API keys to git

---

## Files Affected in Git History

Based on git log analysis:

```
Commits with exposed keys:
- 1dd4771 (Phase 1: Archive historical docs) - Jul 2025
- 54b2b07 (Unknown) - Jul 20, 2025
- eb831f8 (Unknown) - Jul 19, 2025
- 63f6fa9 (Phase 1: Remove backup folder) - Jan 6, 2026
- 2bf5167 (Phase 3: Archive scripts) - Jan 6, 2026

Files containing keys:
- check-cleaner-profile.js (archived)
- check-cleaner-jobs.js (archived)
- Various test files
```

---

## Prevention Measures

### 1. Pre-commit Hooks

Install `git-secrets` to prevent future commits:

```bash
# Install git-secrets
brew install git-secrets

# Setup in repo
cd "/Users/shaunducker/Desktop/Mobile Application - SMPS/Application---Property-Management-"
git secrets --install
git secrets --register-aws  # Catches AWS keys
git secrets --add 'AIza[0-9A-Za-z-_]{35}'  # Catches Google API keys
git secrets --add 'sk_live_[0-9a-zA-Z]{24}'  # Catches Stripe keys
```

### 2. GitHub Secret Scanning

- ✅ Already enabled (detected this issue)
- Configure alerts for your email
- Review alerts immediately

### 3. Environment Variable Best Practices

**DO:**
- ✅ Store secrets in `.env.local`
- ✅ Use `process.env.VARIABLE_NAME`
- ✅ Add `.env*.local` to `.gitignore`
- ✅ Document required env vars in `README.md`

**DON'T:**
- ❌ Never hardcode API keys
- ❌ Never commit `.env.local`
- ❌ Never commit service account JSON files
- ❌ Never share keys in Slack/Discord

### 4. Code Review Checklist

Before merging:
- [ ] No hardcoded API keys
- [ ] All secrets from environment variables
- [ ] `.env.local` not committed
- [ ] No service account files committed

---

## Current Code Status

### ✅ Properly Configured Files

These files correctly use environment variables:

```typescript
// lib/firebase.ts
apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,

// app.json or similar
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
```

### ⚠️ Files to Check

After history rewrite, verify these don't have hardcoded keys:

- `scripts/archive/debug/*.js` (should be deleted or cleaned)
- Any test files
- Any backup files

---

## Timeline

| Time | Action | Status |
|------|--------|--------|
| 17:42 | GitHub alert received | ✅ Received |
| 17:45 | Security report created | ✅ Complete |
| NEXT | Rotate API keys in Google Cloud | ⏳ **DO NOW** |
| NEXT | Remove from git history (BFG) | ⏳ Pending |
| NEXT | Force push cleaned history | ⏳ Pending |
| NEXT | Team notification | ⏳ Pending |
| NEXT | Install git-secrets | ⏳ Pending |

---

## Commands Summary

```bash
# 1. FIRST: Rotate keys in Google Cloud Console (web UI)

# 2. Install BFG
brew install bfg

# 3. Create keys file
cat > ~/Desktop/api-keys-to-remove.txt << 'EOF'
AIzaSyBHZdxlqxv2nC0nDHLQz2FgNw6S8F8FZUA
AIzaSyCDaTQsNpWw0y-g6VeXDYG57eCNtfloxxw
AIzaSyAuE_a_a5TfQYx2hUYu4Lx2Q-BwwEUdGSE
EOF

# 4. Clone mirror
cd ~/Desktop
git clone --mirror https://github.com/TOOL2U/Application---Property-Management-.git repo-mirror

# 5. Run BFG
bfg --replace-text ~/Desktop/api-keys-to-remove.txt repo-mirror

# 6. Cleanup
cd repo-mirror
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 7. Force push (AFTER rotating keys!)
git push --force

# 8. Update local repo
cd "/Users/shaunducker/Desktop/Mobile Application - SMPS/Application---Property-Management-"
git fetch origin
git reset --hard origin/main

# 9. Install git-secrets
brew install git-secrets
git secrets --install
git secrets --add 'AIza[0-9A-Za-z-_]{35}'

# 10. Update .env.local with NEW keys (don't commit!)
# 11. Test app still works
```

---

## Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Secrets](https://github.com/awslabs/git-secrets)
- [Google Cloud: API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

## Sign-Off

**CRITICAL ACTION REQUIRED**

1. ⚠️ **IMMEDIATELY** rotate all exposed API keys in Google Cloud Console
2. ⚠️ Remove keys from git history using BFG
3. ⚠️ Force push cleaned history
4. ✅ Install prevention tools (git-secrets)
5. ✅ Notify team members

**DO NOT** ignore this alert. Exposed API keys can result in:
- Unauthorized API usage
- Unexpected billing charges
- Data breaches
- Service abuse

---

*Report generated: January 6, 2026*
