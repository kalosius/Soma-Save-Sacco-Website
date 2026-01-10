# Push Notifications - Auto-Subscription Setup

## What Changed

### ✅ Browser Subscription Reality
**IMPORTANT**: Browser push subscriptions **CANNOT be created server-side**. Due to browser security:
- Each user MUST grant permission through their browser
- Browser generates unique encryption keys (p256dh, auth)
- Browser creates unique endpoint URL from push service

**What we CAN do**: Make the subscription process automatic and unavoidable when users visit.

---

## Changes Made

### 1. **More Aggressive Auto-Prompt** ✅
- **Removed delay**: Prompt shows immediately (was 1.5 seconds)
- **Already mandatory**: No "Maybe Later" button
- **Auto-subscribe**: Automatically subscribes users who already granted permission

**File**: `src/components/AutoPushPrompt.jsx`
```javascript
// Shows immediately, no delay
setShow(true); // Was: setTimeout(() => setShow(true), 1500)
```

### 2. **Added to Login Page** ✅
Prompt appears immediately when users visit login page.

**File**: `src/pages/Login.jsx`
```jsx
<AutoPushPrompt />
<main className="flex-1 bg-background-light...">
```

### 3. **Added to Register Page** ✅
Prompt appears for new users during registration.

**File**: `src/pages/Register.jsx`
```jsx
<AutoPushPrompt />
<main className="flex-1 bg-background-light...">
```

### 4. **Broadcasting Command** ✅
Easy command to send notifications to all subscribed users.

**File**: `backend/api/management/commands/broadcast_notification.py`

```bash
# Send to all users with subscriptions
python manage.py broadcast_notification --message "Meeting tomorrow at 3 PM!"

# Custom title and URL
python manage.py broadcast_notification \
  --title "💰 Deposit Confirmed" \
  --message "Your deposit of 50,000 UGX has been credited" \
  --url "/member-portal/transactions"

# Verified users only
python manage.py broadcast_notification \
  --message "Important update for all members" \
  --verified-only
```

---

## How Users Get Subscribed

### Current Setup:
1. **User visits website** → Login, Register, or Member Portal
2. **AutoPushPrompt appears immediately** → No delay
3. **User clicks "Enable Notifications Now"** → Only option, can't dismiss
4. **Browser shows permission dialog** → Native browser prompt
5. **User clicks "Allow"** → Browser creates subscription
6. **Frontend sends subscription to backend** → Creates `PushSubscription` record
7. **User is now subscribed** ✅

### Auto-Subscription:
- If user already granted permission before, auto-subscribes silently
- No prompt shown, happens in background

---

## For Production

### When deploying to production:

1. **All users must visit the site**
   - Existing users: Will see prompt on next login
   - New users: Will see prompt during registration

2. **Browser permission is required**
   - Cannot be bypassed for security reasons
   - Users MUST click "Allow" in browser dialog

3. **Service worker must be registered**
   - Already configured in `public/sw.js`
   - Handles incoming push events

4. **HTTPS required**
   - Push notifications only work on HTTPS (or localhost)
   - Your production site must have valid SSL certificate

---

## Sending Notifications in Production

### Method 1: Django Admin (GUI)
1. Go to `/admin/api/customuser/`
2. Select users with checkboxes
3. Actions dropdown → "Send push notification to selected users"
4. Fill form with title/message
5. Click Send

### Method 2: Management Command (CLI)
```bash
# SSH into production server
ssh user@yourserver.com

# Activate virtual environment
source venv/bin/activate

# Send notification
python manage.py broadcast_notification \
  --message "Your message here" \
  --title "Optional custom title"
```

### Method 3: API Endpoint (Programmatic)
```python
# From Python code
from api.utils.push_notifications import send_bulk_notification
from django.contrib.auth import get_user_model

User = get_user_model()
users = User.objects.filter(is_verified=True)

send_bulk_notification(
    users=users,
    title="Test Notification",
    body="This is a test message",
    url="/member-portal"
)
```

---

## Viewing Notification History

### Django Admin
1. Go to: `http://localhost:8000/admin/api/pushnotification/`
2. See all sent notifications with:
   - ✅ **SENT** (green badge)
   - ❌ **FAILED** (red badge)
   - 🟠 **PENDING** (orange badge)

### Database Query
```python
from api.models import PushNotification

# All notifications
PushNotification.objects.all()

# Successful only
PushNotification.objects.filter(status='SENT')

# Failed only
PushNotification.objects.filter(status='FAILED')

# For specific user
PushNotification.objects.filter(user__username='admin')
```

---

## Testing

### 1. Run comprehensive test:
```bash
cd backend
python test_push_notifications.py
```

### 2. Check subscriptions:
```bash
python manage.py shell
>>> from api.models import PushSubscription
>>> PushSubscription.objects.filter(is_active=True).count()
```

### 3. Send test notification:
```bash
python manage.py broadcast_notification --message "Test notification!"
```

---

## Why Database Setting ≠ Subscription

### Database Field (`push_notifications_enabled = True`)
- ✅ User preference/setting
- ✅ Can be set server-side
- ✅ All users have this set to True by default
- ❌ **Does NOT create actual subscription**

### Browser Subscription (`PushSubscription` model)
- ✅ Actual endpoint to receive notifications
- ✅ Contains encryption keys (p256dh, auth)
- ✅ Created by browser after user grants permission
- ❌ **Cannot be created server-side**

**Both are needed**:
1. `push_notifications_enabled = True` → User wants notifications
2. `PushSubscription` exists → User can receive notifications

---

## Current Status

✅ **Ready for production**
- AutoPushPrompt on Login, Register, and Member Portal
- Immediate prompt with no delay
- Mandatory (no dismiss option)
- Auto-subscribes users with existing permission
- Admin broadcast tools ready
- CLI command ready
- Notification history tracking working

⚠️ **Users need to visit and allow**
- Cannot activate subscriptions server-side
- Users must visit website and grant permission
- This is a browser security requirement (cannot be bypassed)

---

## Summary

**You asked**: "activate browser subscription for everyone too"

**Reality**: Technically impossible to activate browser subscriptions server-side due to browser security.

**Solution**: Made the subscription process as automatic and aggressive as possible:
- ✅ Prompt appears immediately on Login, Register, and Member Portal
- ✅ No delay (was 1.5 seconds, now instant)
- ✅ Mandatory (no "Maybe Later" button)
- ✅ Auto-subscribes users who already granted permission
- ✅ All users have `push_notifications_enabled = True` by default

**Next step**: Users must visit the website. Once they do, they'll be prompted immediately and subscriptions will be created automatically if they allow.
