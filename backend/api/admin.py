from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib import messages
from .models import (
    CustomUser, Account, Deposit, ShareTransaction, LoginActivity,
    Borrower, Loan, Payment, RepaymentSchedule, Report, NationalIDVerification,
    University, Course, PushSubscription, PushNotification
)

# Register your models here.


def send_push_notification_to_selected(modeladmin, request, queryset):
    """Admin action to send push notifications to selected users"""
    from .utils.push_notifications import send_bulk_notification
    from django import forms
    from django.shortcuts import render
    
    class NotificationForm(forms.Form):
        title = forms.CharField(max_length=100, initial="Important Announcement")
        message = forms.CharField(widget=forms.Textarea, initial="")
        url = forms.CharField(max_length=500, initial="/member-portal", required=False)
        icon = forms.URLField(max_length=500, initial="/icon-192x192.png", required=False)
    
    # If form was submitted
    if 'apply' in request.POST:
        form = NotificationForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data['title']
            message = form.cleaned_data['message']
            url = form.cleaned_data['url']
            icon = form.cleaned_data['icon']
            
            # Send notifications
            results = send_bulk_notification(
                users=queryset,
                title=title,
                body=message,
                url=url,
                icon=icon
            )
            
            modeladmin.message_user(
                request,
                f"Notification sent! Delivered: {results['sent']}, Failed: {results['failed']}, Total: {results['total']}",
                messages.SUCCESS
            )
            return
    
    # Show form
    form = NotificationForm()
    return render(
        request,
        'admin/send_notification_form.html',
        {
            'users': queryset,
            'form': form,
            'title': 'Send Push Notification',
        }
    )

send_push_notification_to_selected.short_description = "Send push notification to selected users"

@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location', 'is_active']
    search_fields = ['name', 'code']
    list_filter = ['is_active']

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'university', 'duration_years', 'is_active']
    search_fields = ['name', 'code']
    list_filter = ['university', 'is_active']

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'student_id', 'university', 'phone_number', 'is_verified', 'push_notifications_enabled']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    list_filter = ['is_verified', 'university', 'year_of_study']
    actions = [send_push_notification_to_selected]
    fieldsets = UserAdmin.fieldsets + (
        ('Student Information', {'fields': ('student_id', 'university', 'course', 'year_of_study')}),
        ('Contact Information', {'fields': ('phone_number', 'national_id', 'date_of_birth', 'gender', 'next_of_kin', 'profile_image')}),
        ('Verification', {'fields': ('is_verified', 'otp_code', 'otp_created_at')}),
        ('Preferences', {'fields': ('email_notifications', 'sms_notifications', 'transaction_alerts', 'loan_reminders', 'marketing_emails', 'push_notifications_enabled', 'language', 'currency', 'two_factor_auth')}),
    )

admin.site.register(Account)
admin.site.register(Deposit)
admin.site.register(ShareTransaction)
admin.site.register(LoginActivity)
admin.site.register(Borrower)
admin.site.register(Loan)
admin.site.register(Payment)
admin.site.register(RepaymentSchedule)
admin.site.register(Report)
admin.site.register(NationalIDVerification)


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'endpoint_preview', 'is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'endpoint']
    list_filter = ['is_active', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    def endpoint_preview(self, obj):
        return obj.endpoint[:50] + '...' if len(obj.endpoint) > 50 else obj.endpoint
    endpoint_preview.short_description = 'Endpoint'


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user_info', 'status_badge', 'created_at', 'sent_at']
    search_fields = ['title', 'body', 'user__username', 'user__email']
    list_filter = ['status', 'created_at', 'sent_at']
    readonly_fields = ['created_at', 'sent_at']
    date_hierarchy = 'created_at'
    list_per_page = 50
    
    def user_info(self, obj):
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        return "All Users (Broadcast)"
    user_info.short_description = 'Recipient'
    
    def status_badge(self, obj):
        colors = {
            'SENT': 'green',
            'FAILED': 'red',
            'PENDING': 'orange'
        }
        color = colors.get(obj.status, 'gray')
        return f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{obj.status}</span>'
    status_badge.short_description = 'Status'
    status_badge.allow_tags = True
