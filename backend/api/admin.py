from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Account, Deposit, ShareTransaction, LoginActivity,
    Borrower, Loan, Payment, RepaymentSchedule, Report, NationalIDVerification,
    University, Course
)

# Register your models here.

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
    list_display = ['username', 'email', 'first_name', 'last_name', 'student_id', 'university', 'phone_number', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    list_filter = ['is_verified', 'university', 'year_of_study']
    fieldsets = UserAdmin.fieldsets + (
        ('Student Information', {'fields': ('student_id', 'university', 'course', 'year_of_study')}),
        ('Contact Information', {'fields': ('phone_number', 'national_id', 'date_of_birth', 'gender', 'next_of_kin')}),
        ('Verification', {'fields': ('is_verified', 'otp_code', 'otp_created_at')}),
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
