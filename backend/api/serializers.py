from rest_framework import serializers
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
                  'student_id', 'university', 'university_name', 'course', 'course_name', 'year_of_study']
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
