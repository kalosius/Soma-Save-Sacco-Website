from rest_framework import serializers
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import (
    CustomUser, Account, Deposit, ShareTransaction, LoginActivity,
    Borrower, Loan, Payment, RepaymentSchedule, Report, NationalIDVerification,
    University, Course
)


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['id', 'name', 'code', 'location', 'is_active']


class CourseSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'university', 'university_name', 'duration_years', 'is_active']


class CustomUserSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 
                  'national_id', 'date_of_birth', 'gender', 'next_of_kin', 'is_verified',
                  'student_id', 'university', 'university_name', 'course', 'course_name', 'year_of_study', 'profile_image',
                  'email_notifications', 'sms_notifications', 'transaction_alerts', 'loan_reminders',
                  'marketing_emails', 'language', 'currency', 'two_factor_auth']
        read_only_fields = ['id', 'is_verified', 'university_name', 'course_name']


class UserSettingsSerializer(serializers.ModelSerializer):
    """Serializer for user settings/preferences"""
    class Meta:
        model = CustomUser
        fields = ['email_notifications', 'sms_notifications', 'transaction_alerts', 
                  'loan_reminders', 'marketing_emails', 'language', 'currency', 'two_factor_auth']


class AccountSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Account
        fields = '__all__'


class DepositSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Deposit
        fields = '__all__'


class ShareTransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = ShareTransaction
        fields = '__all__'


class LoginActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = LoginActivity
        fields = '__all__'


class BorrowerSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Borrower
        fields = '__all__'


class LoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.user.get_full_name', read_only=True)
    
    class Meta:
        model = Loan
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.user.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'


class RepaymentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepaymentSchedule
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    borrower_name = serializers.CharField(source='borrower.user.get_full_name', read_only=True)
    
    class Meta:
        model = Report
        fields = '__all__'


class NationalIDVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = NationalIDVerification
        fields = '__all__'


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=True)  # Accept full name as username
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    course = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    university = serializers.IntegerField(required=True)
    year_of_study = serializers.IntegerField(required=True)
    student_id = serializers.CharField(required=True)
    phone_number = serializers.CharField(required=True)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 
                  'phone_number', 'student_id', 'university', 'course', 'year_of_study']
    
    def validate_email(self, value):
        """Check if email already exists"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_student_id(self, value):
        """Check if student ID already exists"""
        if value and CustomUser.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("A user with this student ID already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})        
        return attrs
    
    def create(self, validated_data):
        # Remove confirm_password from validated data
        validated_data.pop('confirm_password')
        
        # Split full name from username field
        full_name = validated_data.pop('username', '')
        name_parts = full_name.strip().split(' ', 1)
        first_name = validated_data.pop('first_name', None) or (name_parts[0] if len(name_parts) > 0 else '')
        last_name = validated_data.pop('last_name', None) or (name_parts[1] if len(name_parts) > 1 else '')
        
        # Handle course - can be ID or text
        course_value = validated_data.pop('course', None)
        course_obj = None
        if course_value:
            try:
                # Try to get course by ID
                course_id = int(course_value)
                from .models import Course
                course_obj = Course.objects.filter(id=course_id).first()
            except (ValueError, TypeError):
                # Course is a text string, we'll skip it for now
                pass
        
        # Create user with email as username
        user = CustomUser.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            phone_number=validated_data.get('phone_number', ''),
            student_id=validated_data.get('student_id', ''),
            university_id=validated_data.get('university'),
            course=course_obj,
            year_of_study=validated_data.get('year_of_study')
        )
        
        # Generate account number
        account_count = Account.objects.count() + 1
        account_number = f"SACCO-{account_count:012d}"
        
        # Create default savings account
        Account.objects.create(
            user=user,
            account_number=account_number,
            account_type='Savings Account',
            balance=0.00
        )
        
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Check if user with this email exists"""
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value
    
    def save(self):
        """Send password reset email"""
        email = self.validated_data['email']
        user = CustomUser.objects.get(email=email)
        
        # Generate token and uid
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create reset link
        frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}"
        
        # Check if email is configured
        if not settings.EMAIL_HOST_PASSWORD:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"EMAIL_HOST_PASSWORD not set - cannot send email to {email}")
            raise serializers.ValidationError(
                "Email service is not configured. Please contact support at info@somasave.com or WhatsApp +256 763 200075"
            )
        
        # Send email
        subject = 'SomaSave SACCO - Password Reset Request'
        
        # Plain text version
        text_message = f"""
Hello {user.get_full_name() or user.username},

You recently requested to reset your password for your SomaSave SACCO account.

To reset your password, please click the link below:
{reset_link}

This link will expire in 24 hours for security reasons.

If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.

Best regards,
SomaSave SACCO Team

---
This is an automated message. Please do not reply to this email.
For assistance, contact us at info@somasave.com
        """
        
        # HTML version
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">SomaSave SACCO</h1>
                            <p style="margin: 10px 0 0 0; color: #f0fdf4; font-size: 14px;">Your Trusted Financial Partner</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Hello <strong>{user.get_full_name() or user.username}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                You recently requested to reset your password for your SomaSave SACCO account. Click the button below to proceed with resetting your password.
                            </p>
                            
                            <!-- Reset Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="{reset_link}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 20px 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                                {reset_link}
                            </p>
                            
                            <!-- Security Info Box -->
                            <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                                            🔒 Security Notice
                                        </p>
                                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                                            This link will expire in <strong>24 hours</strong> for security reasons. If you did not request a password reset, please ignore this email or contact our support team immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Best regards,<br>
                                <strong>SomaSave SACCO Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                            <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 13px;">
                                For assistance, contact us at <a href="mailto:info@somasave.com" style="color: #10b981; text-decoration: none;">info@somasave.com</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2025 SomaSave SACCO. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        try:
            # Use EmailMultiAlternatives with shorter timeout to prevent worker timeout
            from django.core.mail import get_connection
            import time
            import socket
            
            max_retries = 2  # Reduced from 3
            retry_delay = 1  # Reduced from 2 seconds
            
            for attempt in range(max_retries):
                try:
                    # Create a fresh connection with shorter timeout to prevent gunicorn worker timeout
                    socket.setdefaulttimeout(15)  # Reduced from 60
                    
                    connection = get_connection(
                        backend='django.core.mail.backends.smtp.EmailBackend',
                        host=settings.EMAIL_HOST,
                        port=settings.EMAIL_PORT,
                        username=settings.EMAIL_HOST_USER,
                        password=settings.EMAIL_HOST_PASSWORD,
                        use_tls=True,
                        timeout=15  # Reduced from 60
                    )
                    
                    email_message = EmailMultiAlternatives(
                        subject=subject,
                        body=text_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[email],
                        connection=connection
                    )
                    
                    # Attach HTML version
                    email_message.attach_alternative(html_message, "text/html")
                    
                    # Send email
                    email_message.send(fail_silently=False)
                    
                    # If successful, break out of retry loop
                    break
                    
                except Exception as retry_error:
                    if attempt < max_retries - 1:
                        # Wait before retrying
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Last attempt failed, raise the error
                        raise retry_error
                        
        except Exception as e:
            # Log the error with full details
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send password reset email to {email} after {max_retries} attempts: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            
            # Check if it's an authentication error
            error_msg = str(e).lower()
            if 'authentication' in error_msg or 'username' in error_msg or 'password' in error_msg or '535' in error_msg:
                logger.error("Email authentication failed - check EMAIL_HOST_PASSWORD in Railway env vars")
                raise serializers.ValidationError(
                    "Email service authentication failed. Please contact support at info@somasave.com or WhatsApp +256 763 200075"
                )
            elif 'connection' in error_msg or 'timeout' in error_msg or 'timed out' in error_msg:
                logger.error("Email connection/timeout error - SMTP server unreachable")
                raise serializers.ValidationError(
                    "Unable to connect to email service. Please contact support at info@somasave.com or WhatsApp +256 763 200075 for password reset assistance."
                )
            elif 'refused' in error_msg:
                logger.error("Connection refused - SMTP port may be blocked")
                raise serializers.ValidationError(
                    "Email service connection refused. Please contact support at info@somasave.com or WhatsApp +256 763 200075"
                )
            else:
                logger.error(f"Unknown email error: {str(e)}")
                raise serializers.ValidationError(
                    f"Unable to send password reset email. Please contact support at info@somasave.com or WhatsApp +256 763 200075"
                )
        
        return {'message': 'Password reset link has been sent to your email.'}


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset"""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validate passwords match"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def validate_token(self, value):
        """Validate the reset token"""
        try:
            uid = self.initial_data.get('uid')
            user_id = urlsafe_base64_decode(uid).decode()
            user = CustomUser.objects.get(pk=user_id)
            
            token_generator = PasswordResetTokenGenerator()
            if not token_generator.check_token(user, value):
                raise serializers.ValidationError("Invalid or expired reset link.")
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            raise serializers.ValidationError("Invalid reset link.")
        
        return value
    
    def save(self):
        """Reset the user's password"""
        uid = self.validated_data['uid']
        user_id = urlsafe_base64_decode(uid).decode()
        user = CustomUser.objects.get(pk=user_id)
        user.set_password(self.validated_data['new_password'])
        user.save()
        return {'message': 'Password has been reset successfully.'}
