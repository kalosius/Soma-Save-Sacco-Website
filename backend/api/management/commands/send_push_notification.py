"""
Django management command to send push notifications to users
Usage:
  python manage.py send_push_notification --all --title "Event Tomorrow" --message "Don't forget our meeting!"
  python manage.py send_push_notification --user john --title "Personal Message" --message "Your loan is approved"
"""
from django.core.management.base import BaseCommand
from api.models import CustomUser
from api.utils.push_notifications import send_bulk_notification


class Command(BaseCommand):
    help = 'Send push notifications to users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Send to all active users',
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Username to send notification to',
        )
        parser.add_argument(
            '--title',
            type=str,
            required=True,
            help='Notification title',
        )
        parser.add_argument(
            '--message',
            type=str,
            required=True,
            help='Notification message',
        )
        parser.add_argument(
            '--url',
            type=str,
            default='/member-portal',
            help='URL to open when notification is clicked',
        )
        parser.add_argument(
            '--icon',
            type=str,
            default='/icon-192x192.png',
            help='Notification icon URL',
        )

    def handle(self, *args, **options):
        title = options['title']
        message = options['message']
        url = options['url']
        icon = options['icon']

        if options['all']:
            # Send to all active users
            users = CustomUser.objects.filter(is_active=True)
            self.stdout.write(f"Sending notification to {users.count()} users...")
            
            results = send_bulk_notification(
                users=users,
                title=title,
                body=message,
                url=url,
                icon=icon
            )
            
            self.stdout.write(self.style.SUCCESS(
                f"✓ Sent: {results['sent']}, Failed: {results['failed']}, Total: {results['total']}"
            ))
            
        elif options['user']:
            # Send to specific user
            try:
                user = CustomUser.objects.get(username=options['user'])
                users = [user]
                
                self.stdout.write(f"Sending notification to {user.username}...")
                
                results = send_bulk_notification(
                    users=users,
                    title=title,
                    body=message,
                    url=url,
                    icon=icon
                )
                
                self.stdout.write(self.style.SUCCESS(
                    f"✓ Sent: {results['sent']}, Failed: {results['failed']}"
                ))
                
            except CustomUser.DoesNotExist:
                self.stdout.write(self.style.ERROR(
                    f"✗ User '{options['user']}' not found"
                ))
        else:
            self.stdout.write(self.style.ERROR(
                "✗ Please specify either --all or --user USERNAME"
            ))
