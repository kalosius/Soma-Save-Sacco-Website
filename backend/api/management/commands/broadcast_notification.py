"""
Management command to broadcast push notification to all users or users with active subscriptions
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import PushSubscription
from api.utils.push_notifications import send_bulk_notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Broadcast push notification to all users with active subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--title',
            type=str,
            default='📢 Important Announcement',
            help='Notification title'
        )
        parser.add_argument(
            '--message',
            type=str,
            required=True,
            help='Notification message (required)'
        )
        parser.add_argument(
            '--url',
            type=str,
            default='/member-portal',
            help='URL to open when notification is clicked'
        )
        parser.add_argument(
            '--icon',
            type=str,
            default='/icon-192x192.png',
            help='Icon URL for notification'
        )
        parser.add_argument(
            '--all-users',
            action='store_true',
            help='Send to all users with active subscriptions (default)'
        )
        parser.add_argument(
            '--verified-only',
            action='store_true',
            help='Send only to verified users'
        )

    def handle(self, *args, **options):
        title = options['title']
        message = options['message']
        url = options['url']
        icon = options['icon']
        all_users = options['all_users']
        verified_only = options['verified_only']

        self.stdout.write(self.style.WARNING('🔔 Broadcasting Push Notification'))
        self.stdout.write(self.style.WARNING('=' * 70))
        
        # Get users with active subscriptions
        users_with_subs = User.objects.filter(
            push_subscriptions__is_active=True
        ).distinct()
        
        if verified_only:
            users_with_subs = users_with_subs.filter(is_verified=True)
            self.stdout.write(f"📋 Filter: Verified users only")
        
        if not users_with_subs.exists():
            self.stdout.write(self.style.ERROR('❌ No users with active push subscriptions found'))
            self.stdout.write(self.style.WARNING('\n💡 Users need to:'))
            self.stdout.write('   1. Log in to the member portal')
            self.stdout.write('   2. Enable push notifications when prompted')
            self.stdout.write('   3. Grant browser permission')
            return
        
        total_users = users_with_subs.count()
        total_subs = PushSubscription.objects.filter(
            user__in=users_with_subs,
            is_active=True
        ).count()
        
        self.stdout.write(f"📊 Target audience:")
        self.stdout.write(f"   - Users: {total_users}")
        self.stdout.write(f"   - Active subscriptions: {total_subs}")
        self.stdout.write(f"\n📝 Message details:")
        self.stdout.write(f"   - Title: {title}")
        self.stdout.write(f"   - Message: {message}")
        self.stdout.write(f"   - URL: {url}")
        self.stdout.write(f"   - Icon: {icon}")
        
        # Confirm
        confirm = input(f"\n⚠️  Send notification to {total_users} user(s)? (yes/no): ")
        
        if confirm.lower() != 'yes':
            self.stdout.write(self.style.WARNING('❌ Broadcast cancelled'))
            return
        
        self.stdout.write(self.style.WARNING('\n📤 Sending notifications...'))
        
        # Send notifications
        results = send_bulk_notification(
            users=users_with_subs,
            title=title,
            body=message,
            url=url,
            icon=icon
        )
        
        # Display results
        self.stdout.write(self.style.SUCCESS('\n✅ Broadcast complete!'))
        self.stdout.write(self.style.WARNING('=' * 70))
        self.stdout.write(f"📊 Results:")
        self.stdout.write(f"   - Total attempts: {results['total']}")
        self.stdout.write(self.style.SUCCESS(f"   - Successfully sent: {results['sent']}"))
        if results['failed'] > 0:
            self.stdout.write(self.style.ERROR(f"   - Failed: {results['failed']}"))
        
        success_rate = (results['sent'] / results['total'] * 100) if results['total'] > 0 else 0
        self.stdout.write(f"\n📈 Success rate: {success_rate:.1f}%")
        
        self.stdout.write(self.style.SUCCESS('\n✨ Check Django admin for notification records:'))
        self.stdout.write('   http://localhost:8000/admin/api/pushnotification/')
