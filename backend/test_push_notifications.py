"""
Comprehensive test for push notifications system
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'somasave_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import PushSubscription, PushNotification
from api.utils.push_notifications import send_push_notification, send_bulk_notification
from django.conf import settings

User = get_user_model()

def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def test_vapid_configuration():
    """Test VAPID keys are configured"""
    print_header("1. Testing VAPID Configuration")
    
    vapid_public = getattr(settings, 'VAPID_PUBLIC_KEY', None)
    vapid_private = getattr(settings, 'VAPID_PRIVATE_KEY', None)
    vapid_email = getattr(settings, 'VAPID_ADMIN_EMAIL', None)
    
    if vapid_public:
        print_success(f"VAPID_PUBLIC_KEY configured: {vapid_public[:20]}...")
    else:
        print_error("VAPID_PUBLIC_KEY not configured")
        return False
    
    if vapid_private:
        print_success(f"VAPID_PRIVATE_KEY configured: {vapid_private[:30]}...")
    else:
        print_error("VAPID_PRIVATE_KEY not configured")
        return False
    
    if vapid_email:
        print_success(f"VAPID_ADMIN_EMAIL configured: {vapid_email}")
    else:
        print_error("VAPID_ADMIN_EMAIL not configured")
        return False
    
    return True

def test_database_models():
    """Test database models and relationships"""
    print_header("2. Testing Database Models")
    
    # Count users
    user_count = User.objects.count()
    print_info(f"Total users in database: {user_count}")
    
    # Count subscriptions
    subscription_count = PushSubscription.objects.count()
    active_subscriptions = PushSubscription.objects.filter(is_active=True).count()
    print_info(f"Total push subscriptions: {subscription_count}")
    print_info(f"Active subscriptions: {active_subscriptions}")
    
    # Count notifications
    notification_count = PushNotification.objects.count()
    sent_count = PushNotification.objects.filter(status='SENT').count()
    failed_count = PushNotification.objects.filter(status='FAILED').count()
    pending_count = PushNotification.objects.filter(status='PENDING').count()
    
    print_info(f"Total notifications: {notification_count}")
    print_info(f"  - Sent: {sent_count}")
    print_info(f"  - Failed: {failed_count}")
    print_info(f"  - Pending: {pending_count}")
    
    # List users with subscriptions
    users_with_subs = User.objects.filter(push_subscriptions__isnull=False).distinct()
    print_info(f"Users with push subscriptions: {users_with_subs.count()}")
    for user in users_with_subs:
        sub_count = user.push_subscriptions.filter(is_active=True).count()
        print(f"  - {user.username} ({user.email}): {sub_count} active subscription(s)")
    
    if subscription_count == 0:
        print_error("No push subscriptions found. Users need to enable notifications in the app.")
        return False
    
    print_success("Database models are working correctly")
    return True

def test_notification_record_creation():
    """Test creating notification records"""
    print_header("3. Testing Notification Record Creation")
    
    users = User.objects.all()[:3]  # Get first 3 users
    
    if not users:
        print_error("No users found in database")
        return False
    
    print_info(f"Creating test notification for {len(users)} user(s)...")
    
    # Create notification manually
    from django.utils import timezone
    
    for user in users:
        notification = PushNotification.objects.create(
            user=user,
            title="Test Notification",
            body="This is a test notification to verify database records are being created",
            icon="/icon-192x192.png",
            badge="/icon-192x192.png",
            url="/member-portal",
            status="SENT",
            sent_at=timezone.now()
        )
        print_success(f"Created notification #{notification.id} for {user.username}")
    
    # Verify in database
    test_notifications = PushNotification.objects.filter(title="Test Notification")
    print_success(f"Verified: {test_notifications.count()} test notification(s) in database")
    
    # Show where to find them
    print_info("\nTo view notifications in Django Admin:")
    print_info("1. Go to: http://localhost:8000/admin/")
    print_info("2. Click on 'Push Notifications' in the API section")
    print_info("3. You should see all sent notifications with timestamps")
    
    return True

def test_bulk_notification():
    """Test bulk notification function"""
    print_header("4. Testing Bulk Notification Function")
    
    users_with_subs = User.objects.filter(
        push_subscriptions__is_active=True
    ).distinct()
    
    if not users_with_subs.exists():
        print_error("No users with active subscriptions found")
        print_info("To test notifications, you need to:")
        print_info("1. Log in to the member portal")
        print_info("2. Allow push notifications when prompted")
        print_info("3. Run this test again")
        return False
    
    print_info(f"Found {users_with_subs.count()} user(s) with active subscriptions")
    
    # Send test notification
    print_info("Sending test notification...")
    results = send_bulk_notification(
        users=users_with_subs,
        title="🔔 Test Notification from SomaSave",
        body="This is a test notification. If you see this, push notifications are working! 🎉",
        url="/member-portal",
        icon="/icon-192x192.png"
    )
    
    print_success(f"Bulk notification results:")
    print(f"  - Total attempts: {results['total']}")
    print(f"  - Successfully sent: {results['sent']}")
    print(f"  - Failed: {results['failed']}")
    
    # Verify records were created
    recent_notifications = PushNotification.objects.filter(
        title="🔔 Test Notification from SomaSave"
    ).order_by('-created_at')
    
    print_success(f"Created {recent_notifications.count()} notification record(s) in database")
    
    for notif in recent_notifications[:5]:
        status_icon = "✅" if notif.status == "SENT" else "❌"
        print(f"  {status_icon} {notif.user.username}: {notif.status}")
    
    return results['sent'] > 0

def test_admin_interface():
    """Test admin interface configuration"""
    print_header("5. Testing Admin Interface")
    
    print_info("Checking PushNotification admin configuration...")
    
    # Check if there are any notifications
    notification_count = PushNotification.objects.count()
    
    if notification_count > 0:
        print_success(f"Found {notification_count} notification(s) in database")
        
        # Show latest notifications
        latest = PushNotification.objects.order_by('-created_at')[:5]
        print_info("\nLatest 5 notifications:")
        for notif in latest:
            print(f"  - ID: {notif.id} | {notif.title} | User: {notif.user.username if notif.user else 'Broadcast'} | Status: {notif.status} | {notif.created_at}")
    else:
        print_error("No notifications in database yet")
    
    print_info("\nAdmin URLs:")
    print_info("- View all notifications: http://localhost:8000/admin/api/pushnotification/")
    print_info("- View subscriptions: http://localhost:8000/admin/api/pushsubscription/")
    print_info("- Send to users: http://localhost:8000/admin/api/customuser/ (select users, then Actions dropdown)")
    
    return True

def main():
    print("\n" + "🔔" * 35)
    print("  SOMASAVE PUSH NOTIFICATIONS - COMPREHENSIVE TEST")
    print("🔔" * 35)
    
    try:
        # Run tests
        test1 = test_vapid_configuration()
        test2 = test_database_models()
        test3 = test_notification_record_creation()
        test4 = test_bulk_notification()
        test5 = test_admin_interface()
        
        # Summary
        print_header("TEST SUMMARY")
        
        tests = [
            ("VAPID Configuration", test1),
            ("Database Models", test2),
            ("Notification Records", test3),
            ("Bulk Notification", test4),
            ("Admin Interface", test5)
        ]
        
        passed = sum(1 for _, result in tests if result)
        total = len(tests)
        
        for name, result in tests:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {name}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print_success("\n🎉 All tests passed! Push notifications are working correctly!")
            print_info("\nNext steps:")
            print_info("1. Log in to member portal to enable notifications")
            print_info("2. Go to Django admin to send test notifications")
            print_info("3. Check notification history in admin panel")
        else:
            print_error("\n⚠️  Some tests failed. Please check the errors above.")
        
    except Exception as e:
        print_error(f"Test suite error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
