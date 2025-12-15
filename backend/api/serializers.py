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
                  'student_id', 'university', 'university_name', 'course', 'course_name', 'year_of_study', 'profile_image']
        read_only_fields = ['id', 'is_verified', 'university_name', 'course_name']


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
        
        # Send email
        subject = 'SomaSave SACCO - Password Reset Request'
        message = f"""
Hello {user.get_full_name() or user.username},

You requested to reset your password for your SomaSave SACCO account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

Best regards,
SomaSave SACCO Team
        """
        
        try:
            # Use EmailMultiAlternatives with retry logic
            from django.core.mail import get_connection
            import time
            import socket
            
            max_retries = 3
            retry_delay = 2  # seconds
            
            for attempt in range(max_retries):
                try:
                    # Create a fresh connection for each attempt with extended timeout
                    # Increase socket timeout to handle slow connections
                    socket.setdefaulttimeout(60)
                    
                    connection = get_connection(
                        backend='django.core.mail.backends.smtp.EmailBackend',
                        host=settings.EMAIL_HOST,
                        port=settings.EMAIL_PORT,
                        username=settings.EMAIL_HOST_USER,
                        password=settings.EMAIL_HOST_PASSWORD,
                        use_tls=True,
                        timeout=60
                    )
                    
                    email_message = EmailMultiAlternatives(
                        subject=subject,
                        body=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[email],
                        connection=connection
                    )
                    
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
            # Log the error but don't expose it to the user
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send password reset email to {email} after {max_retries} attempts: {str(e)}")
            raise serializers.ValidationError(
                "Unable to send password reset email. Please try again later or contact support."
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
