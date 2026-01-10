"""
Push notification utilities using pywebpush library
"""
from pywebpush import webpush, WebPushException
from django.conf import settings
import json
import logging

logger = logging.getLogger(__name__)


def send_push_notification(subscription, title, body, icon=None, badge=None, url=None, data=None):
    """
    Send a push notification to a subscription
    
    Args:
        subscription: PushSubscription model instance
        title: Notification title
        body: Notification body text
        icon: URL to notification icon
        badge: URL to notification badge
        url: URL to open when notification is clicked
        data: Additional data to send with notification
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Prepare notification payload
        payload = {
            'title': title,
            'body': body,
            'icon': icon or '/icon-192x192.png',
            'badge': badge or '/icon-192x192.png',
            'url': url or '/',
            'timestamp': int(subscription.created_at.timestamp() * 1000),
        }
        
        if data:
            payload['data'] = data
        
        # Get VAPID keys from settings
        vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
        vapid_public_key = getattr(settings, 'VAPID_PUBLIC_KEY', None)
        vapid_claims = {
            "sub": f"mailto:{getattr(settings, 'VAPID_ADMIN_EMAIL', 'admin@somasave.com')}"
        }
        
        if not vapid_private_key or not vapid_public_key:
            logger.error("VAPID keys not configured in settings")
            return False
        
        # Prepare subscription info
        subscription_info = {
            'endpoint': subscription.endpoint,
            'keys': {
                'p256dh': subscription.p256dh_key,
                'auth': subscription.auth_key
            }
        }
        
        # Send the notification
        response = webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=vapid_private_key,
            vapid_claims=vapid_claims
        )
        
        logger.info(f"Push notification sent successfully to subscription {subscription.id}")
        return True
    
    except WebPushException as e:
        logger.error(f"WebPush error for subscription {subscription.id}: {e}")
        
        # If subscription is invalid (410 Gone), mark as inactive
        if e.response and e.response.status_code == 410:
            subscription.is_active = False
            subscription.save()
            logger.info(f"Marked subscription {subscription.id} as inactive (410 Gone)")
        
        return False
    
    except Exception as e:
        logger.error(f"Failed to send push notification: {str(e)}", exc_info=True)
        return False


def generate_vapid_keys():
    """
    Generate VAPID keys for web push notifications
    Run this once and save the keys in your environment variables
    """
    from pywebpush import webpush
    from py_vapid import Vapid
    
    vapid = Vapid()
    vapid.generate_keys()
    
    print("=" * 60)
    print("VAPID Keys Generated - Add these to your .env file:")
    print("=" * 60)
    print(f"VAPID_PUBLIC_KEY={vapid.public_key.decode('utf-8')}")
    print(f"VAPID_PRIVATE_KEY={vapid.private_key.decode('utf-8')}")
    print("=" * 60)
    
    return {
        'public_key': vapid.public_key.decode('utf-8'),
        'private_key': vapid.private_key.decode('utf-8')
    }


def send_bulk_notification(users, title, body, icon=None, badge=None, url=None):
    """
    Send push notification to multiple users
    
    Args:
        users: QuerySet or list of CustomUser instances
        title: Notification title
        body: Notification body text
        icon: URL to notification icon
        badge: URL to notification badge
        url: URL to open when notification is clicked
    
    Returns:
        dict: Statistics about sent notifications
    """
    from ..models import PushSubscription
    
    total = 0
    sent = 0
    failed = 0
    
    for user in users:
        subscriptions = PushSubscription.objects.filter(user=user, is_active=True)
        for subscription in subscriptions:
            total += 1
            try:
                if send_push_notification(subscription, title, body, icon, badge, url):
                    sent += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Error sending to subscription {subscription.id}: {str(e)}")
                failed += 1
    
    return {
        'total': total,
        'sent': sent,
        'failed': failed
    }
