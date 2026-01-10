# Admin Guide: Sending Push Notifications

Yes! **Admins can send notifications to all users at any time** - perfect for event reminders, announcements, system updates, etc.

## 🎯 Three Ways to Send Notifications

### Method 1: Django Admin Interface (Easiest) ⭐

1. **Log into Django Admin**: `http://localhost:8000/admin`

2. **Go to Users**: Click on "Custom users"

3. **Select Recipients**:
   - Select specific users, OR
   - Select all users (checkbox at top)

4. **Choose Action**: 
   - From the "Action" dropdown, select **"Send push notification to selected users"**
   - Click "Go"

5. **Fill the Form**:
   - **Title**: "Upcoming Event" (max 100 chars)
   - **Message**: "Don't forget our meeting tomorrow at 10 AM!"
   - **URL**: `/member-portal` (where to go when clicked)
   - **Icon**: `/icon-192x192.png` (notification icon)

6. **Send**: Click "Send Notification"

7. **View Results**: You'll see how many notifications were sent successfully

---

### Method 2: Command Line (Quick)

Perfect for scheduled tasks or cron jobs:

```bash
cd backend

# Send to ALL users
python manage.py send_push_notification \
  --all \
  --title "Event Tomorrow" \
  --message "Don't forget our community meeting at 10 AM!" \
  --url "/member-portal"

# Send to specific user
python manage.py send_push_notification \
  --user john \
  --title "Personal Message" \
  --message "Your loan has been approved!" \
  --url "/member-portal/loans"
```

**Options:**
- `--all`: Send to all active users
- `--user USERNAME`: Send to specific user
- `--title`: Notification title (required)
- `--message`: Notification message (required)
- `--url`: URL to open (default: `/member-portal`)
- `--icon`: Icon URL (default: `/icon-192x192.png`)

---

### Method 3: API Endpoint (Programmatic)

For integrations or custom admin interfaces:

**Endpoint**: `POST /api/push-notifications/broadcast/`

**Headers**:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Upcoming Event",
  "body": "Don't forget our meeting tomorrow at 10 AM!",
  "url": "/member-portal",
  "icon": "/icon-192x192.png"
}
```

**Response**:
```json
{
  "message": "Broadcast sent successfully",
  "recipients": 150,
  "sent": 148,
  "failed": 2,
  "notification_id": 42
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8000/api/push-notifications/broadcast/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Announcement",
    "body": "System maintenance scheduled for tonight at 11 PM",
    "url": "/member-portal"
  }'
```

**Python Example**:
```python
import requests

response = requests.post(
    'http://localhost:8000/api/push-notifications/broadcast/',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'title': 'Upcoming Event',
        'body': 'Meeting tomorrow at 10 AM!',
        'url': '/member-portal'
    }
)

print(response.json())
```

---

## 📝 Common Use Cases

### 1. Event Reminders
```bash
python manage.py send_push_notification \
  --all \
  --title "Event Tomorrow! 📅" \
  --message "Annual General Meeting - Tomorrow 10 AM at Main Hall" \
  --url "/member-portal"
```

### 2. Payment Deadlines
```bash
python manage.py send_push_notification \
  --all \
  --title "Payment Reminder ⏰" \
  --message "Loan payments due in 3 days. Pay now to avoid penalties." \
  --url "/member-portal/loans"
```

### 3. System Announcements
```bash
python manage.py send_push_notification \
  --all \
  --title "System Maintenance 🔧" \
  --message "SomaSave will be offline tonight 11 PM - 2 AM for updates" \
  --url "/member-portal"
```

### 4. New Features
```bash
python manage.py send_push_notification \
  --all \
  --title "New Feature! 🎉" \
  --message "Check out our new mobile app! Download now from your app store." \
  --url "/member-portal"
```

### 5. Emergency Alerts
```bash
python manage.py send_push_notification \
  --all \
  --title "⚠️ Urgent: Security Alert" \
  --message "Please update your password immediately for security reasons" \
  --url "/member-portal/settings"
```

---

## 🤖 Scheduling Notifications

### Using Cron (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add scheduled notifications:
```bash
# Send payment reminder every Monday at 9 AM
0 9 * * 1 cd /path/to/backend && python manage.py send_push_notification --all --title "Payment Week" --message "Loan payments due this Friday"

# Send event reminder on specific date
0 9 1 * * cd /path/to/backend && python manage.py send_push_notification --all --title "Monthly Meeting" --message "Meeting today at 2 PM"
```

### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create New Task
3. **Trigger**: Set time/date
4. **Action**: Start a program
   - Program: `python.exe`
   - Arguments: `manage.py send_push_notification --all --title "Your Title" --message "Your Message"`
   - Start in: `C:\path\to\backend`

---

## 💡 Best Practices

### ✅ DO:
- **Keep titles short** (under 50 characters)
- **Be clear and actionable** in messages
- **Include relevant URLs** for quick access
- **Test with yourself first** before broadcasting
- **Time notifications appropriately** (avoid late night)
- **Use emojis sparingly** for visual appeal
- **Track delivery stats** to monitor effectiveness

### ❌ DON'T:
- **Don't spam users** - send only important updates
- **Don't send at odd hours** unless urgent
- **Don't use all caps** in titles/messages
- **Don't send without testing first**
- **Don't ignore failed deliveries** - investigate issues

---

## 📊 Monitoring & Analytics

### View Notification History

**Django Admin**:
1. Go to Admin → Push notifications
2. Filter by status, date, etc.
3. See delivery statistics

**Database Query**:
```python
from api.models import PushNotification
from django.db.models import Count

# Today's notifications
today = PushNotification.objects.filter(created_at__date=timezone.now().date())
print(f"Sent today: {today.count()}")

# Success rate
stats = PushNotification.objects.values('status').annotate(count=Count('id'))
print(stats)
```

### View Active Subscriptions

```python
from api.models import PushSubscription

# Total active subscriptions
active = PushSubscription.objects.filter(is_active=True).count()
print(f"Active subscriptions: {active}")

# By user
from django.db.models import Count
user_stats = PushSubscription.objects.filter(is_active=True) \
    .values('user__username') \
    .annotate(devices=Count('id')) \
    .order_by('-devices')
```

---

## 🔒 Security & Permissions

- ✅ Only **staff users** can send broadcasts
- ✅ Regular users can only see their own notifications
- ✅ All admin actions are logged
- ✅ Failed delivery attempts are tracked
- ✅ Invalid subscriptions auto-deactivated

---

## 🐛 Troubleshooting

### "No subscriptions found"
- Users need to enable notifications in Settings first
- Check if users have active subscriptions in admin

### "Failed to send"
- Verify VAPID keys are configured correctly
- Check internet connection
- Verify users have valid subscriptions

### "Permission denied"
- Make sure you're logged in as staff/admin
- Check user permissions in Django admin

---

## 📖 Quick Reference

| Method | Use Case | Difficulty |
|--------|----------|------------|
| Django Admin | Manual, occasional broadcasts | ⭐ Easy |
| Command Line | Scheduled tasks, automation | ⭐⭐ Medium |
| API Endpoint | Custom integrations, apps | ⭐⭐⭐ Advanced |

---

## 🎯 Example Workflow

**Monthly Event Reminder**:

1. **Week before event**:
   ```bash
   python manage.py send_push_notification --all \
     --title "Event Next Week 📅" \
     --message "Save the date: Annual Meeting on Jan 15th"
   ```

2. **Day before event**:
   ```bash
   python manage.py send_push_notification --all \
     --title "Event Tomorrow! ⏰" \
     --message "Don't forget: Annual Meeting tomorrow at 10 AM"
   ```

3. **Day of event** (morning):
   ```bash
   python manage.py send_push_notification --all \
     --title "Event Today! 🎉" \
     --message "Annual Meeting starts in 2 hours. See you there!"
   ```

---

**Need Help?** Check the main documentation:
- `PUSH_NOTIFICATIONS_GUIDE.md` - Complete guide
- `PUSH_NOTIFICATIONS_REFERENCE.md` - Quick reference
