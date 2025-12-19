# Make Deposit Button Production Fix

## Issue
The Make Deposit button works on localhost but not in production.

## Root Cause
The API URL was hardcoded, and the frontend build wasn't using the correct production API URL.

## Changes Made

### 1. Dynamic API URL Configuration
**File**: `src/services/api.js`
- Changed from hardcoded URL to environment-based:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://soma-save-sacco-website-production.up.railway.app/api';
```

### 2. Environment Files Created
- **`.env`** (Development): `VITE_API_URL=http://127.0.0.1:8000/api`
- **`.env.production`** (Production): `VITE_API_URL=https://soma-save-sacco-website-production.up.railway.app/api`

### 3. Better Error Messages
**File**: `src/components/DepositModal.jsx`
- Added authentication-specific error messages
- Users will see "Please log in again" if session expired

### 4. Production Build
- Installed terser for minification
- Built new production files in `dist/` folder

## Deployment Steps

### Step 1: Deploy Frontend (REQUIRED)
Upload the entire `dist/` folder to your production server (somasave.com).

**If using Railway for frontend:**
```bash
# Commit and push
git add .
git commit -m "Fix: Make deposit button production config"
git push
```

**If using cPanel/FTP:**
1. Upload contents of `dist/` folder to public_html
2. Clear browser cache after uploading

### Step 2: Verify Backend CORS (Already Configured)
Your Railway backend already has these in `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://somasave.com",
    "https://www.somasave.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://somasave.com",
    "https://www.somasave.com",
]
```

### Step 3: Test in Production
1. Go to https://somasave.com/member-portal
2. Make sure you're logged in
3. Click "Make Deposit" button
4. Modal should open
5. Enter amount and phone number
6. Relworx popup should open

## Common Production Issues & Solutions

### Issue: "Authentication required" error
**Solution**: Log out and log back in. Session cookies may have expired.

### Issue: Button does nothing
**Solution**: 
1. Open browser dev console (F12)
2. Check for errors
3. Look for CORS errors - means backend CORS needs update

### Issue: "Failed to initiate deposit"
**Solutions**:
- Check if backend is running: Visit `https://soma-save-sacco-website-production.up.railway.app/api/`
- Verify you're logged in (session valid)
- Check Railway logs for backend errors

### Issue: Modal opens but API call fails
**Solution**: Check browser console for specific error. Common causes:
- CSRF token missing (clear cookies and re-login)
- Backend endpoint not deployed (redeploy backend)
- CORS blocking request (verify CORS settings)

## Verification Checklist

- [ ] New build created (`npm run build` completed successfully)
- [ ] `dist/` folder uploaded to production server
- [ ] Browser cache cleared
- [ ] Logged into production site
- [ ] Click Make Deposit button
- [ ] Modal opens
- [ ] Can enter amount
- [ ] API call succeeds (check Network tab)
- [ ] Relworx popup opens

## Files Modified
- ✅ `src/services/api.js` - Dynamic API URL
- ✅ `src/components/DepositModal.jsx` - Better error handling
- ✅ `.env` - Development config
- ✅ `.env.production` - Production config (NEW)
- ✅ `vite.config.js` - Removed broken babel plugin
- ✅ `package.json` - Added terser dependency

## Next Steps

1. **Deploy the `dist/` folder to production** ⚠️ CRITICAL
2. Test the button on production site
3. If issues persist, check browser console and share the error message

---

**Status**: ✅ Code fixed, awaiting production deployment
