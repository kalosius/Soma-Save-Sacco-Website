from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class University(models.Model):
    """University model for storing list of universities"""
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'university'
        verbose_name_plural = 'Universities'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Course(models.Model):
    """Course/Program model"""
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, null=True, blank=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='courses', null=True, blank=True)
    duration_years = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'course'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    """Custom user model with student information"""
    # Contact Information
    phone_number = models.CharField(max_length=15, blank=True, default='')
    national_id = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    next_of_kin = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.URLField(max_length=500, null=True, blank=True)
    
    # Student Information
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    university = models.ForeignKey(University, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    year_of_study = models.IntegerField(null=True, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    
    # Settings/Preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    transaction_alerts = models.BooleanField(default=True)
    loan_reminders = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='en')
    currency = models.CharField(max_length=10, default='UGX')
    two_factor_auth = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'clients_portal_customuser'
    
    def __str__(self):
        return f"{self.username} - {self.get_full_name()}"


class Account(models.Model):
    """Savings account model matching clients_portal_account"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='accounts')
    account_number = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=50)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    date_created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clients_portal_account'
    
    def __str__(self):
        return f"{self.account_number} - {self.user.username}"


class Deposit(models.Model):
    """Deposit transactions matching clients_portal_deposit"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='deposits')
    tx_ref = models.CharField(max_length=100, unique=True)
    transaction_id = models.CharField(max_length=200, null=True, blank=True)  # Relworx transaction ID
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clients_portal_deposit'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tx_ref} - {self.amount} - {self.status}"


class ShareTransaction(models.Model):
    """Share transactions matching clients_portal_sharetransaction"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='share_transactions')
    number_of_shares = models.IntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20)
    status = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clients_portal_sharetransaction'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.number_of_shares} shares"


class LoginActivity(models.Model):
    """Login activity tracking matching clients_portal_loginactivity"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='login_activities')
    ip_address = models.GenericIPAddressField()
    location = models.CharField(max_length=255, null=True, blank=True)
    device = models.CharField(max_length=255, null=True, blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'clients_portal_loginactivity'
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time}"


class Borrower(models.Model):
    """Borrower profile matching adminapp_borrower"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='borrower_profile')
    date_joined = models.DateTimeField(auto_now_add=True)
    address = models.CharField(max_length=255)
    photo_url = models.URLField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'adminapp_borrower'
    
    def __str__(self):
        return f"{self.user.username} - Borrower"


class Loan(models.Model):
    """Loan model matching adminapp_loan"""
    LOAN_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('DISBURSED', 'Disbursed'),
        ('COMPLETED', 'Completed'),
    ]
    
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='loans')
    loan_code = models.CharField(max_length=7, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    start_date = models.DateTimeField()
    due_date = models.DateTimeField()
    loan_status = models.CharField(max_length=20, choices=LOAN_STATUS_CHOICES, default='PENDING')
    
    class Meta:
        db_table = 'adminapp_loan'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.loan_code} - {self.borrower.user.username}"


class Payment(models.Model):
    """Payment model matching adminapp_payment"""
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='payments')
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    
    class Meta:
        db_table = 'adminapp_payment'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.borrower.user.username} - {self.amount}"


class RepaymentSchedule(models.Model):
    """Repayment schedule matching adminapp_repaymentschedule"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]
    
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayment_schedules')
    installment_number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    class Meta:
        db_table = 'adminapp_repaymentschedule'
        ordering = ['due_date']
    
    def __str__(self):
        return f"Loan {self.loan.loan_code} - Installment {self.installment_number}"


class Report(models.Model):
    """Report model matching adminapp_report"""
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='reports')
    total_loans = models.DecimalField(max_digits=12, decimal_places=2)
    total_payments = models.DecimalField(max_digits=12, decimal_places=2)
    report_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'adminapp_report'
        ordering = ['-report_date']
    
    def __str__(self):
        return f"Report for {self.borrower.user.username} - {self.report_date}"


class NationalIDVerification(models.Model):
    """National ID verification matching clients_portal_nationalidverification"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    
    full_name = models.CharField(max_length=100)
    nin = models.CharField(max_length=20)
    card_number = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=10)
    sex = models.CharField(max_length=1)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    front_image = models.CharField(max_length=100)
    back_image = models.CharField(max_length=100)
    extracted_text_front = models.TextField()
    extracted_text_back = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clients_portal_nationalidverification'
    
    def __str__(self):
        return f"{self.full_name} - {self.nin}"


class PushSubscription(models.Model):
    """Web Push notification subscription"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh_key = models.CharField(max_length=255)
    auth_key = models.CharField(max_length=255)
    user_agent = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_pushsubscription'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.endpoint[:50]}..."


class PushNotification(models.Model):
    """Push notification history"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='push_notifications', null=True, blank=True)
    title = models.CharField(max_length=100)
    body = models.TextField()
    icon = models.URLField(max_length=500, null=True, blank=True)
    badge = models.URLField(max_length=500, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_pushnotification'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.status}"
