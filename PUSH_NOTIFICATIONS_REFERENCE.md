# 🔔 Push Notifications - Quick Reference

## Setup (First Time Only)

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Generate VAPID keys
python setup_push_notifications.py

# 3. Add keys to .env files (from generated txt files)
# backend/.env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_ADMIN_EMAIL
# .env: VITE_VAPID_PUBLIC_KEY

# 4. Run migrations
python manage.py makemigrations
python manage.py migrate

# 5. Restart servers
```

## Usage

### Enable Notifications (User)
1. Go to Settings → Notifications section
2. Click "Enable Notifications"
3. Allow when browser asks

### Send Notification (Code)

**Single User:**
```python
from api.models import PushSubscription
from api.utils.push_notifications import send_push_notification

subscriptions = PushSubscription.objects.filter(user=user, is_active=True)
for sub in subscriptions:
    send_push_notification(sub, "Title", "Body", "/url")
```

**Multiple Users:**
```python
from api.utils.push_notifications import send_bulk_notification

send_bulk_notification(users, "Title", "Body", "/url")
```

## API Endpoints

```
POST /api/push-subscriptions/          - Subscribe
POST /api/push-subscriptions/unsubscribe/ - Unsubscribe
GET  /api/push-notifications/          - History
```

## Files Modified

**Backend:**
- `api/models.py` - PushSubscription, PushNotification
- `api/views.py` - ViewSets + auto-notification on deposits
- `api/serializers.py` - Serializers
- `api/urls.py` - Routes
- `api/admin.py` - Admin panels
- `api/utils/push_notifications.py` - Send functions

**Frontend:**
- `src/components/PushNotificationManager.jsx` - UI
- `src/components/Settings.jsx` - Integration
- `public/sw.js` - Push handlers

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Notifications not showing | Check browser permissions & VAPID keys |
| Subscription fails | Verify public key in frontend .env |
| Backend errors | Install pywebpush & py-vapid |
| 410 Gone errors | Subscription auto-marked inactive |

## Environment Variables

**Backend (.env):**
```env
VAPID_PUBLIC_KEY=BH...
VAPID_PRIVATE_KEY=...
VAPID_ADMIN_EMAIL=admin@somasave.com
```

**Frontend (.env):**
```env
VITE_VAPID_PUBLIC_KEY=BH...
```

## Automatic Notifications

Currently enabled for:
- ✅ Deposit confirmations

Add more in `views.py` similar to webhook handler.

---

**Docs:** See `PUSH_NOTIFICATIONS_GUIDE.md` for full details
