# Push Notifications Implementation Guide

## Overview
Push notifications have been successfully implemented for SomaSave. Users can now receive real-time notifications on their devices even when they're not actively using the app.

## Features Implemented

### Backend (Django)
1. **Models** (`backend/api/models.py`):
   - `PushSubscription`: Stores user device subscriptions
   - `PushNotification`: Tracks notification history

2. **API Endpoints** (`backend/api/views.py`, `backend/api/urls.py`):
   - `POST /api/push-subscriptions/`: Subscribe to push notifications
   - `POST /api/push-subscriptions/unsubscribe/`: Unsubscribe from notifications
   - `POST /api/push-subscriptions/send_notification/`: Send test notification (staff only)
   - `GET /api/push-notifications/`: View notification history

3. **Utilities** (`backend/api/utils/push_notifications.py`):
   - `send_push_notification()`: Send notification to a single subscription
   - `send_bulk_notification()`: Send notifications to multiple users
   - `generate_vapid_keys()`: Generate VAPID keys for web push

### Frontend (React)
1. **Component** (`src/components/PushNotificationManager.jsx`):
   - Request notification permissions
   - Subscribe/unsubscribe to push notifications
   - Display subscription status

2. **Service Worker** (`public/sw.js`):
   - Handle incoming push notifications
   - Display notifications
   - Handle notification clicks

## Setup Instructions

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Generate VAPID Keys
Run this command in the Django shell to generate VAPID keys:

```bash
cd backend
python manage.py shell
```

Then in the Python shell:
```python
from api.utils.push_notifications import generate_vapid_keys
generate_vapid_keys()
```

This will output something like:
```
============================================================
VAPID Keys Generated - Add these to your .env file:
============================================================
VAPID_PUBLIC_KEY=BHPq...xyz
VAPID_PRIVATE_KEY=abc...123
============================================================
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_ADMIN_EMAIL=admin@somasave.com
```

**Frontend** (`.env`):
```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

### 4. Update Django Settings
Add to `backend/somasave_backend/settings.py`:
```python
from decouple import config

VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')
VAPID_ADMIN_EMAIL = config('VAPID_ADMIN_EMAIL', default='admin@somasave.com')
```

### 5. Run Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Usage

### For Users
1. Go to Settings in the member portal
2. Find the "Push Notifications" section
3. Click "Enable Notifications"
4. Allow notifications when browser prompts
5. Users will now receive push notifications for important events

### Sending Notifications (Programmatically)

#### Send to a Single User
```python
from api.models import CustomUser, PushSubscription
from api.utils.push_notifications import send_push_notification

user = CustomUser.objects.get(username='john')
subscriptions = PushSubscription.objects.filter(user=user, is_active=True)

for subscription in subscriptions:
    send_push_notification(
        subscription,
        title='New Deposit Received',
        body='Your deposit of UGX 50,000 has been confirmed',
        url='/member-portal/transactions'
    )
```

#### Send to Multiple Users
```python
from api.models import CustomUser
from api.utils.push_notifications import send_bulk_notification

users = CustomUser.objects.filter(is_active=True)
results = send_bulk_notification(
    users,
    title='Important Announcement',
    body='The system will be under maintenance from 2AM to 4AM',
    url='/member-portal'
)

print(f"Sent: {results['sent']}, Failed: {results['failed']}")
```

#### Integrate with Deposit Webhook
You can automatically send notifications when deposits are successful. In `backend/api/views.py`, add to the `RelworxWebhookView`:

```python
# After deposit is confirmed and balance updated
if payment_status == 'successful':
    # ... existing code ...
    
    # Send push notification
    from .utils.push_notifications import send_push_notification
    subscriptions = PushSubscription.objects.filter(
        user=deposit.user,
        is_active=True
    )
    
    for subscription in subscriptions:
        try:
            send_push_notification(
                subscription,
                title='Deposit Confirmed!',
                body=f'Your deposit of UGX {deposit.amount:,.0f} has been credited to your account',
                url='/member-portal/transactions'
            )
        except Exception as e:
            logger.error(f"Failed to send push notification: {str(e)}")
```

## Testing

### Test Notification via API
As a staff user, you can send test notifications:

```bash
# Get user ID
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send test notification
curl -X POST http://localhost:8000/api/push-subscriptions/send_notification/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification from SomaSave",
    "url": "/member-portal",
    "user_id": USER_ID
  }'
```

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari (iOS 16.4+): Full support
- Opera: Full support

## Security Considerations
1. **VAPID Keys**: Keep private key secure, never commit to version control
2. **Permissions**: Only staff can send notifications via admin endpoint
3. **User Control**: Users can enable/disable notifications at any time
4. **Inactive Subscriptions**: Automatically marked when browser sends 410 Gone

## Troubleshooting

### Notifications not appearing
1. Check browser notification permissions
2. Verify service worker is registered
3. Check browser console for errors
4. Verify VAPID keys are configured correctly

### Subscription fails
1. Ensure VAPID public key is accessible to frontend
2. Check service worker is registered and active
3. Verify HTTPS connection (required for push notifications)

### Backend errors
1. Check VAPID keys are set in environment variables
2. Verify pywebpush library is installed
3. Check Django logs for detailed error messages

## Production Deployment

### HTTPS Required
Push notifications only work over HTTPS. Make sure your production environment uses SSL/TLS.

### Service Worker Registration
Ensure service worker is properly registered in production build:
- Check `sw.js` is accessible at root path
- Verify service worker scope includes all pages

### Environment Variables
Set all required environment variables on your hosting platform:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_ADMIN_EMAIL

## Future Enhancements
1. **Notification Categories**: Different notification types (transactions, loans, announcements)
2. **Quiet Hours**: Allow users to set do-not-disturb times
3. **Rich Notifications**: Add images, action buttons
4. **Notification Center**: In-app notification history
5. **Analytics**: Track notification delivery and engagement rates
6. **Scheduled Notifications**: Queue notifications for future delivery
