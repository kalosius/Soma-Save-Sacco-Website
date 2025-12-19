from django.shortcuts import render
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import (
    CustomUser, Account, Deposit, ShareTransaction, LoginActivity,
    Borrower, Loan, Payment, RepaymentSchedule, Report, NationalIDVerification,
    University, Course
)
from .serializers import (
    CustomUserSerializer, AccountSerializer, DepositSerializer, 
    ShareTransactionSerializer, LoginActivitySerializer, BorrowerSerializer,
    LoanSerializer, PaymentSerializer, RepaymentScheduleSerializer, 
    ReportSerializer, NationalIDVerificationSerializer, RegisterSerializer,
    UniversitySerializer, CourseSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserSettingsSerializer
)

# Create your views here.

class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = University.objects.filter(is_active=True)
    serializer_class = UniversitySerializer
    permission_classes = [AllowAny]


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filter courses by university if provided"""
        queryset = Course.objects.filter(is_active=True)
        university_id = self.request.query_params.get('university', None)
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        return queryset

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], url_path='update-profile')
    def update_profile(self, request):
        """Update current user's profile with Cloudinary image upload support"""
        import cloudinary.uploader
        import logging
        logger = logging.getLogger(__name__)
        
        user = request.user
        logger.info(f"=== Profile Update Debug ===")
        logger.info(f"User: {user.username}")
        logger.info(f"Is authenticated: {user.is_authenticated}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"CSRF token in headers: {request.META.get('HTTP_X_CSRFTOKEN', 'NOT FOUND')}")
        logger.info(f"Request data keys: {list(request.data.keys())}")
        logger.info(f"Request FILES keys: {list(request.FILES.keys())}")
        logger.info(f"=============================")
        
        # Use dict() for MultiValueDict to avoid copy() issues
        data = {}
        for key, value in request.data.items():
            if key != 'profile_image':  # Skip file field
                data[key] = value
        
        logger.info(f"Processing data fields: {list(data.keys())}")
        
        # Handle profile image upload to Cloudinary
        if 'profile_image' in request.FILES:
            try:
                image_file = request.FILES['profile_image']
                logger.info(f"Uploading image: {image_file.name}, size: {image_file.size} bytes")
                
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    image_file,
                    folder='somasave/profiles',
                    public_id=f'user_{user.id}',
                    overwrite=True,
                    resource_type='image',
                    transformation=[
                        {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                        {'quality': 'auto:good'}
                    ]
                )
                # Store the secure URL
                data['profile_image'] = upload_result['secure_url']
                logger.info(f"Image uploaded successfully to: {upload_result['secure_url']}")
            except Exception as e:
                logger.error(f"Image upload failed: {str(e)}", exc_info=True)
                return Response(
                    {'error': f'Image upload failed: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        logger.info(f"Updating profile with data: {data}")
        serializer = self.get_serializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Profile updated successfully for user: {user.username}")
            return Response(serializer.data)
        
        logger.error(f"Serializer validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def user_settings(self, request):
        """Get or update user settings"""
        user = request.user
        
        if request.method == 'GET':
            serializer = UserSettingsSerializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PATCH':
            serializer = UserSettingsSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Settings updated successfully',
                    'settings': serializer.data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Change user password with enhanced validation"""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Both current and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password length
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password doesn't match current
        if user.check_password(new_password):
            return Response(
                {'error': 'New password must be different from current password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Additional password strength validations
        import re
        if not re.search(r'[A-Za-z]', new_password):
            return Response(
                {'error': 'Password must contain at least one letter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not re.search(r'\d', new_password):
            return Response(
                {'error': 'Password must contain at least one number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Log password change activity (optional - create a simple log entry)
        try:
            LoginActivity.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1'),
                location='Password Change',
                device=request.META.get('HTTP_USER_AGENT', 'Unknown')[:255]
            )
        except Exception as e:
            # Don't fail password change if logging fails
            print(f"Failed to log activity: {e}")
        
        return Response({'message': 'Password changed successfully'})
    
    @action(detail=False, methods=['post'], url_path='enable-2fa', permission_classes=[IsAuthenticated])
    def enable_2fa(self, request):
        """Enable two-factor authentication and send OTP"""
        user = request.user
        
        if user.two_factor_auth:
            return Response(
                {'error': 'Two-factor authentication is already enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate and send OTP
        import random
        from django.utils import timezone
        from django.core.mail import send_mail
        from django.conf import settings
        
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Send OTP via email
        try:
            print(f"=== Sending 2FA OTP Email ===")
            print(f"To: {user.email}")
            print(f"OTP: {otp}")
            print(f"From: {settings.DEFAULT_FROM_EMAIL}")
            print(f"Email Host: {settings.EMAIL_HOST}")
            print(f"============================")
            
            send_mail(
                subject='SomaSave SACCO - Enable 2FA Verification Code',
                message=f'Your verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            print(f"✅ Email sent successfully to {user.email}")
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to send OTP: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent to your email',
            'email': user.email
        })
    
    @action(detail=False, methods=['post'], url_path='verify-2fa', permission_classes=[IsAuthenticated])
    def verify_2fa(self, request):
        """Verify OTP and enable 2FA"""
        user = request.user
        otp = request.data.get('otp')
        
        if not otp:
            return Response(
                {'error': 'OTP is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.otp_code or not user.otp_created_at:
            return Response(
                {'error': 'No OTP found. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OTP is expired (10 minutes)
        from django.utils import timezone
        from datetime import timedelta
        
        if timezone.now() - user.otp_created_at > timedelta(minutes=10):
            user.otp_code = None
            user.otp_created_at = None
            user.save()
            return Response(
                {'error': 'OTP has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if user.otp_code != otp:
            return Response(
                {'error': 'Invalid OTP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Enable 2FA
        user.two_factor_auth = True
        user.otp_code = None
        user.otp_created_at = None
        user.save()
        
        return Response({
            'message': 'Two-factor authentication enabled successfully',
            'two_factor_auth': True
        })
    
    @action(detail=False, methods=['post'], url_path='disable-2fa', permission_classes=[IsAuthenticated])
    def disable_2fa(self, request):
        """Disable two-factor authentication"""
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Password is required to disable 2FA'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Disable 2FA
        user.two_factor_auth = False
        user.otp_code = None
        user.otp_created_at = None
        user.save()
        
        return Response({
            'message': 'Two-factor authentication disabled successfully',
            'two_factor_auth': False
        })
    
    @action(detail=False, methods=['post'], url_path='send-login-otp', permission_classes=[AllowAny])
    def send_login_otp(self, request):
        """Send OTP for login 2FA (public endpoint)"""
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate and send OTP
        import random
        from django.utils import timezone
        from django.core.mail import send_mail
        from django.conf import settings
        
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Send OTP via email
        try:
            print(f"=== Sending Login OTP Email ===\nTo: {user.email}\nOTP: {otp}")
            send_mail(
                subject='SomaSave SACCO - Login Verification Code',
                message=f'Your login verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not attempt to log in, please secure your account immediately.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"✅ Login OTP sent successfully")
        except Exception as e:
            print(f"❌ Failed to send login OTP: {str(e)}")
            return Response(
                {'error': f'Failed to send OTP: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent to your email',
            'email': user.email
        })


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter accounts by current user if not staff"""
        if self.request.user.is_staff:
            return Account.objects.all()
        return Account.objects.filter(user=self.request.user)


class DepositViewSet(viewsets.ModelViewSet):
    queryset = Deposit.objects.all()
    serializer_class = DepositSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter deposits by current user if not staff"""
        if self.request.user.is_staff:
            return Deposit.objects.all()
        return Deposit.objects.filter(user=self.request.user)


class ShareTransactionViewSet(viewsets.ModelViewSet):
    queryset = ShareTransaction.objects.all()
    serializer_class = ShareTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter share transactions by current user if not staff"""
        if self.request.user.is_staff:
            return ShareTransaction.objects.all()
        return ShareTransaction.objects.filter(user=self.request.user)


class LoginActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LoginActivity.objects.all()
    serializer_class = LoginActivitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter login activities by current user if not staff"""
        if self.request.user.is_staff:
            return LoginActivity.objects.all()
        return LoginActivity.objects.filter(user=self.request.user)


class BorrowerViewSet(viewsets.ModelViewSet):
    queryset = Borrower.objects.all()
    serializer_class = BorrowerSerializer
    permission_classes = [IsAuthenticated]


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter loans by current user if not staff"""
        if self.request.user.is_staff:
            return Loan.objects.all()
        try:
            borrower = self.request.user.borrower_profile
            return Loan.objects.filter(borrower=borrower)
        except Borrower.DoesNotExist:
            return Loan.objects.none()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a loan application"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can approve loans'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        loan = self.get_object()
        loan.loan_status = 'APPROVED'
        loan.save()
        
        serializer = self.get_serializer(loan)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments by current user if not staff"""
        if self.request.user.is_staff:
            return Payment.objects.all()
        try:
            borrower = self.request.user.borrower_profile
            return Payment.objects.filter(borrower=borrower)
        except Borrower.DoesNotExist:
            return Payment.objects.none()


class RepaymentScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RepaymentSchedule.objects.all()
    serializer_class = RepaymentScheduleSerializer
    permission_classes = [IsAuthenticated]


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]


class NationalIDVerificationViewSet(viewsets.ModelViewSet):
    queryset = NationalIDVerification.objects.all()
    serializer_class = NationalIDVerificationSerializer
    permission_classes = [IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required for registration
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(views.APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required for login
    
    def post(self, request):
        identifier = request.data.get('identifier')  # Can be email or student_id
        password = request.data.get('password')
        
        if not identifier or not password:
            return Response(
                {'error': 'Please provide both email/student ID and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find user by email or student_id
        user = None
        try:
            # First try to find by email (username)
            user_obj = CustomUser.objects.get(email=identifier)
            user = authenticate(request, username=user_obj.username, password=password)
        except CustomUser.DoesNotExist:
            # Try to find by student_id
            try:
                user_obj = CustomUser.objects.get(student_id=identifier)
                user = authenticate(request, username=user_obj.username, password=password)
            except CustomUser.DoesNotExist:
                pass
        
        if user is not None:
            # Check if 2FA is enabled
            if user.two_factor_auth:
                # Check if OTP is provided
                otp = request.data.get('otp')
                
                if not otp:
                    # OTP not provided, need to send OTP
                    import random
                    from django.utils import timezone
                    from django.core.mail import send_mail
                    from django.conf import settings
                    
                    otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
                    user.otp_code = otp_code
                    user.otp_created_at = timezone.now()
                    user.save()
                    
                    # Send OTP via email
                    try:
                        print(f"=== Sending 2FA Login OTP ===\nTo: {user.email}\nOTP: {otp_code}")
                        send_mail(
                            subject='SomaSave SACCO - Login Verification Code',
                            message=f'Your login verification code is: {otp_code}\n\nThis code will expire in 10 minutes.\n\nIf you did not attempt to log in, please secure your account immediately.',
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                        print(f"✅ 2FA Login OTP sent successfully")
                    except Exception as e:
                        print(f"❌ Failed to send 2FA login OTP: {str(e)}")
                        return Response(
                            {'error': f'Failed to send OTP: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    return Response({
                        'requires_2fa': True,
                        'user_id': user.id,
                        'message': 'OTP sent to your email',
                        'email': user.email
                    }, status=status.HTTP_200_OK)
                
                # OTP provided, verify it
                if not user.otp_code or not user.otp_created_at:
                    return Response(
                        {'error': 'No OTP found. Please request a new one.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if OTP is expired (10 minutes)
                from django.utils import timezone
                from datetime import timedelta
                
                if timezone.now() - user.otp_created_at > timedelta(minutes=10):
                    user.otp_code = None
                    user.otp_created_at = None
                    user.save()
                    return Response(
                        {'error': 'OTP has expired. Please request a new one.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verify OTP
                if user.otp_code != otp:
                    return Response(
                        {'error': 'Invalid OTP'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Clear OTP after successful verification
                user.otp_code = None
                user.otp_created_at = None
                user.save()
            
            # Proceed with login
            login(request, user)
            
            # Debug: Check session after login
            print(f"=== Login Success Debug ===")
            print(f"User logged in: {user.username}")
            print(f"Session key after login: {request.session.session_key}")
            print(f"Session data: {dict(request.session)}")
            print(f"AUTH_USER_ID: {request.session.get('_auth_user_id')}")
            print(f"Set-Cookie header check")
            print(f"===========================")
            
            # Ensure session is saved
            request.session.save()
            
            # Get user's accounts
            accounts = Account.objects.filter(user=user)
            
            # Log successful login
            try:
                LoginActivity.objects.create(
                    user=user,
                    ip_address=request.META.get('REMOTE_ADDR', '127.0.0.1'),
                    location='Login',
                    device=request.META.get('HTTP_USER_AGENT', 'Unknown')[:255]
                )
            except Exception as e:
                # Don't fail login if logging fails
                print(f"Failed to log login activity: {e}")
            
            response = Response({
                'message': 'Login successful',
                'user': CustomUserSerializer(user).data,
                'accounts': AccountSerializer(accounts, many=True).data
            })
            
            # Set session cookie with production-ready settings
            # Use environment variables to determine if we're in production
            from django.conf import settings
            is_production = not settings.DEBUG
            
            response.set_cookie(
                key='sessionid',
                value=request.session.session_key,
                max_age=86400,
                httponly=True,
                samesite='None' if is_production else 'Lax',
                secure=is_production,  # True in production (HTTPS)
                domain=None
            )
            
            return response
        
        return Response(
            {'error': 'Invalid credentials. Please check your email/student ID and password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Clear session
        logout(request)
        # Also flush the session to ensure complete cleanup
        request.session.flush()
        
        response = Response({'message': 'Logout successful'})
        # Delete cookies with same settings as when they were set
        from django.conf import settings
        is_production = not settings.DEBUG
        
        # Delete cookies properly for Django 5.0+
        response.delete_cookie(
            'sessionid',
            samesite='None' if is_production else 'Lax'
        )
        response.delete_cookie(
            'csrftoken',
            samesite='None' if is_production else 'Lax'
        )
        return response


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Add debug logging
        print(f"=== CurrentUserView Debug ===")
        print(f"User: {request.user}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Session key: {request.session.session_key}")
        print(f"Session data: {dict(request.session)}")
        print(f"=============================")
        
        accounts = Account.objects.filter(user=request.user)
        
        return Response({
            'user': CustomUserSerializer(request.user).data,
            'accounts': AccountSerializer(accounts, many=True).data
        })


class DashboardStatsView(views.APIView):
    """Dashboard statistics for member portal"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.db.models import Sum, Count, Q
        from datetime import datetime, timedelta
        from decimal import Decimal
        
        # Debug logging
        print(f"=== Dashboard Request Debug ===")
        print(f"User: {request.user}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Session key: {request.session.session_key}")
        print(f"Session data: {dict(request.session)}")
        print(f"Cookies received: {request.COOKIES}")
        print(f"All headers: {request.headers}")
        print(f"AUTH_USER_ID in session: {request.session.get('_auth_user_id')}")
        print(f"Origin: {request.headers.get('Origin', 'No origin header')}")
        print(f"Referer: {request.headers.get('Referer', 'No referer')}")
        print(f"================================")
        
        user = request.user
        
        # Get accounts and total balance
        accounts = Account.objects.filter(user=user)
        total_savings = accounts.aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        # Get active loans
        try:
            borrower = user.borrower_profile
            active_loans = Loan.objects.filter(
                borrower=borrower,
                loan_status__in=['APPROVED', 'DISBURSED']
            )
            active_loans_count = active_loans.count()
            total_loan_amount = active_loans.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        except Borrower.DoesNotExist:
            active_loans_count = 0
            total_loan_amount = Decimal('0.00')
        
        # Calculate dividends (using share transactions or a dividend model)
        current_year = datetime.now().year
        dividends = ShareTransaction.objects.filter(
            user=user,
            timestamp__year=current_year,
            transaction_type='DIVIDEND'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Get recent transactions (deposits and payments)
        recent_deposits = Deposit.objects.filter(user=user)[:5]
        recent_transactions = []
        
        for deposit in recent_deposits:
            recent_transactions.append({
                'type': 'Savings Deposit',
                'amount': str(deposit.amount),
                'date': deposit.created_at.strftime('%b %d, %Y'),
                'status': deposit.status,
                'icon': 'add_circle'
            })
        
        # Add loan payments if borrower exists
        try:
            borrower = user.borrower_profile
            recent_payments = Payment.objects.filter(borrower=borrower)[:3]
            for payment in recent_payments:
                recent_transactions.append({
                    'type': 'Loan Repayment',
                    'amount': '-' + str(payment.amount),
                    'date': payment.payment_date.strftime('%b %d, %Y'),
                    'status': payment.payment_status,
                    'icon': 'remove_circle'
                })
        except Borrower.DoesNotExist:
            pass
        
        # Sort by date (most recent first)
        recent_transactions = sorted(recent_transactions, key=lambda x: x['date'], reverse=True)[:5]
        
        # Calculate savings growth percentage (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        deposits_last_month = Deposit.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago,
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        if total_savings > 0:
            growth_percentage = (deposits_last_month / total_savings * 100)
        else:
            growth_percentage = Decimal('0.00')
        
        return Response({
            'user': CustomUserSerializer(user).data,
            'stats': {
                'total_savings': str(total_savings),
                'active_loans_count': active_loans_count,
                'total_loan_amount': str(total_loan_amount),
                'dividends': str(dividends),
                'savings_growth': f"{growth_percentage:.1f}%"
            },
            'recent_transactions': recent_transactions,
            'accounts': [{
                'account_number': acc.account_number,
                'account_type': acc.account_type,
                'balance': str(acc.balance)
            } for acc in accounts]
        })


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetRequestView(views.APIView):
    """API view to request password reset"""
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response(result, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class PasswordResetConfirmView(views.APIView):
    """API view to confirm password reset"""
    permission_classes = [AllowAny]
    authentication_classes = []  # No authentication required
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response(result, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class TestEmailConfigView(views.APIView):
    """API view to test email configuration - for debugging only"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """Check email configuration without sending email"""
        from django.conf import settings
        import logging
        
        logger = logging.getLogger(__name__)
        
        config_status = {
            'EMAIL_HOST': getattr(settings, 'EMAIL_HOST', None),
            'EMAIL_PORT': getattr(settings, 'EMAIL_PORT', None),
            'EMAIL_HOST_USER': getattr(settings, 'EMAIL_HOST_USER', None),
            'EMAIL_HOST_PASSWORD_SET': bool(getattr(settings, 'EMAIL_HOST_PASSWORD', None)),
            'EMAIL_USE_TLS': getattr(settings, 'EMAIL_USE_TLS', None),
            'DEFAULT_FROM_EMAIL': getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            'FRONTEND_URL': getattr(settings, 'FRONTEND_URL', None),
            'DEBUG': settings.DEBUG,
        }
        
        logger.info(f"Email configuration check: {config_status}")
        
        # Check for common issues
        issues = []
        if not config_status['EMAIL_HOST_PASSWORD_SET']:
            issues.append("EMAIL_HOST_PASSWORD is not set")
        if not config_status['FRONTEND_URL']:
            issues.append("FRONTEND_URL is not set")
        if config_status['EMAIL_PORT'] not in [587, 465, 25]:
            issues.append(f"Unusual EMAIL_PORT: {config_status['EMAIL_PORT']}")
        
        return Response({
            'status': 'ok' if not issues else 'warning',
            'configuration': config_status,
            'issues': issues,
            'message': 'Email configuration loaded' if not issues else 'Email configuration has issues'
        })
    
    def post(self, request):
        """Send a test email to verify configuration"""
        from django.conf import settings
        from django.core.mail import EmailMultiAlternatives
        from django.core.mail import get_connection
        import logging
        import socket
        
        logger = logging.getLogger(__name__)
        
        test_email = request.data.get('email', settings.EMAIL_HOST_USER)
        
        if not test_email:
            return Response({
                'status': 'error',
                'message': 'No email address provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Attempting to send test email to {test_email}")
        
        try:
            socket.setdefaulttimeout(15)
            
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=settings.EMAIL_HOST,
                port=settings.EMAIL_PORT,
                username=settings.EMAIL_HOST_USER,
                password=settings.EMAIL_HOST_PASSWORD,
                use_tls=True,
                timeout=15
            )
            
            subject = 'SomaSave SACCO - Email Test'
            text_message = 'This is a test email from SomaSave SACCO. If you received this, email configuration is working correctly.'
            html_message = '<html><body><h2>Test Email</h2><p>This is a test email from SomaSave SACCO.</p><p>If you received this, email configuration is working correctly.</p></body></html>'
            
            email_message = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[test_email],
                connection=connection
            )
            
            email_message.attach_alternative(html_message, "text/html")
            email_message.send(fail_silently=False)
            
            logger.info(f"Test email sent successfully to {test_email}")
            
            return Response({
                'status': 'success',
                'message': f'Test email sent successfully to {test_email}'
            })
            
        except Exception as e:
            logger.error(f"Failed to send test email: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            return Response({
                'status': 'error',
                'message': f'Failed to send test email: {str(e)}',
                'error_type': type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InitiateDepositView(views.APIView):
    """Initiate a deposit payment with Relworx"""
    permission_classes = [IsAuthenticated]
    http_method_names = ['post', 'options']
    
    def post(self, request):
        import uuid
        import logging
        from django.utils import timezone
        from .relworx import RelworxPaymentGateway
        
        logger = logging.getLogger(__name__)
        user = request.user
        
        # Get amount from request
        amount = request.data.get('amount')
        phone_number = request.data.get('phone_number') or user.phone_number
        currency = request.data.get('currency', 'UGX')  # Default to UGX
        
        if not amount:
            return Response({
                'error': 'Amount is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = float(amount)
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check minimum amount based on currency
            min_amounts = {'UGX': 500, 'KES': 10, 'TZS': 500, 'RWF': 100}
            if currency in min_amounts and amount < min_amounts[currency]:
                return Response({
                    'error': f'Minimum amount for {currency} is {min_amounts[currency]}'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError:
            return Response({
                'error': 'Invalid amount'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not phone_number:
            return Response({
                'error': 'Phone number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Ensure phone number is in international format
        if not phone_number.startswith('+'):
            # Assume Uganda if no country code
            phone_number = f"+256{phone_number.lstrip('0')}"
        
        # Generate unique transaction reference (8-36 characters as per Relworx spec)
        tx_ref = f"SACCO_{user.id}_{uuid.uuid4().hex[:12].upper()}"
        
        # Create pending deposit record (created_at auto-set by auto_now_add)
        deposit = Deposit.objects.create(
            user=user,
            tx_ref=tx_ref,
            amount=amount,
            status='PENDING'
        )
        
        logger.info(f"Deposit initiated: {tx_ref} for user {user.username}, amount: {amount}")
        
        # Initialize Relworx gateway and request payment
        relworx = RelworxPaymentGateway()
        result = relworx.request_payment(
            reference=tx_ref,
            msisdn=phone_number,
            currency=currency,
            amount=amount,
            description=f"SomaSave SACCO Deposit - {user.first_name} {user.last_name}"
        )
        
        if not result['success']:
            # Mark deposit as failed
            deposit.status = 'FAILED'
            deposit.save()
            
            logger.error(f"Relworx payment request failed: {result.get('error')}")
            return Response({
                'error': result.get('error', 'Failed to initiate payment')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store Relworx internal reference
        relworx_data = result['data']
        deposit.transaction_id = relworx_data.get('internal_reference', '')
        deposit.save()
        
        logger.info(f"Relworx payment initiated: {relworx_data}")
        
        # Return payment details
        return Response({
            'success': True,
            'tx_ref': tx_ref,
            'internal_reference': relworx_data.get('internal_reference'),
            'amount': amount,
            'currency': currency,
            'phone_number': phone_number,
            'message': relworx_data.get('message', 'Payment request sent. Please check your phone to complete payment.'),
            'user': {
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email
            }
        })


class VerifyDepositView(views.APIView):
    """Verify deposit payment status with Relworx"""
    permission_classes = [IsAuthenticated]
    http_method_names = ['post', 'options']
    
    def post(self, request):
        import logging
        from decimal import Decimal
        from django.utils import timezone
        from django.db import transaction
        from .relworx import RelworxPaymentGateway
        
        logger = logging.getLogger(__name__)
        user = request.user
        
        tx_ref = request.data.get('tx_ref')
        
        if not tx_ref:
            return Response({
                'error': 'Transaction reference is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the deposit record
            deposit = Deposit.objects.get(tx_ref=tx_ref, user=user)
            
            if deposit.status == 'COMPLETED':
                # Already processed
                account = Account.objects.get(user=user, account_type='SAVINGS')
                return Response({
                    'message': 'Deposit already completed',
                    'tx_ref': tx_ref,
                    'amount': float(deposit.amount),
                    'new_balance': float(account.balance),
                    'status': 'COMPLETED'
                })
            
            if deposit.status != 'PENDING':
                return Response({
                    'error': 'Transaction already processed',
                    'status': deposit.status
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check status with Relworx
            relworx = RelworxPaymentGateway()
            result = relworx.check_request_status(customer_reference=tx_ref)
            
            if not result['success']:
                return Response({
                    'error': 'Failed to verify payment status',
                    'details': result.get('error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            payment_data = result['data']
            payment_status = payment_data.get('request_status') or payment_data.get('status')
            
            logger.info(f"Payment status from Relworx: {payment_status} for {tx_ref}")
            
            # Update deposit based on status
            if payment_status == 'success':
                with transaction.atomic():
                    # Update deposit record
                    deposit.status = 'COMPLETED'
                    deposit.transaction_id = payment_data.get('provider_transaction_id', deposit.transaction_id)
                    deposit.save()
                    
                    # Get or create user's savings account
                    account, created = Account.objects.get_or_create(
                        user=user,
                        account_type='SAVINGS',
                        defaults={
                            'account_number': f"SAV{user.id:06d}",
                            'balance': Decimal('0.00')
                        }
                    )
                    
                    # Update account balance
                    account.balance += Decimal(str(deposit.amount))
                    account.save()
                    
                    logger.info(f"Deposit completed: {tx_ref}, amount: {deposit.amount}, new balance: {account.balance}")
                    
                    return Response({
                        'message': 'Deposit successful',
                        'tx_ref': tx_ref,
                        'amount': float(deposit.amount),
                        'new_balance': float(account.balance),
                        'status': 'COMPLETED',
                        'provider_transaction_id': payment_data.get('provider_transaction_id')
                    })
                    
            elif payment_status in ['failed', 'cancelled']:
                # Payment failed or cancelled
                deposit.status = 'FAILED'
                deposit.save()
                
                logger.warning(f"Deposit failed: {tx_ref}, status: {payment_status}")
                
                return Response({
                    'error': 'Payment failed or was cancelled',
                    'tx_ref': tx_ref,
                    'status': 'FAILED',
                    'message': payment_data.get('message')
                }, status=status.HTTP_400_BAD_REQUEST)
                
            else:
                # Still pending
                return Response({
                    'message': 'Payment is still being processed',
                    'tx_ref': tx_ref,
                    'status': 'PENDING'
                }, status=status.HTTP_202_ACCEPTED)
                
        except Deposit.DoesNotExist:
            return Response({
                'error': 'Transaction not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error verifying deposit: {str(e)}", exc_info=True)
            return Response({
                'error': f'Error processing payment: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RelworxWebhookView(views.APIView):
    """Handle webhook callbacks from Relworx"""
    permission_classes = [AllowAny]  # Webhooks don't use authentication
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        import logging
        from decimal import Decimal
        from django.db import transaction
        from .relworx import RelworxPaymentGateway
        
        logger = logging.getLogger(__name__)
        
        # Get webhook signature from header
        signature_header = request.META.get('HTTP_RELWORX_SIGNATURE', '')
        
        if not signature_header:
            logger.warning("Webhook received without signature")
            return Response({'error': 'Missing signature'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Parse signature header: "t=timestamp,v=signature"
        parts = dict(part.split('=') for part in signature_header.split(','))
        timestamp = parts.get('t')
        signature = parts.get('v')
        
        if not timestamp or not signature:
            logger.warning("Invalid signature format")
            return Response({'error': 'Invalid signature format'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get webhook data
        webhook_data = {
            'status': request.data.get('status'),
            'customer_reference': request.data.get('customer_reference'),
            'internal_reference': request.data.get('internal_reference')
        }
        
        # Verify signature
        relworx = RelworxPaymentGateway()
        webhook_url = request.build_absolute_uri()
        
        is_valid = relworx.verify_webhook_signature(
            webhook_url=webhook_url,
            timestamp=timestamp,
            signature=signature,
            params=webhook_data
        )
        
        if not is_valid:
            logger.warning(f"Invalid webhook signature for {webhook_data.get('customer_reference')}")
            return Response({'error': 'Invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)
        
        logger.info(f"Valid webhook received: {webhook_data}")
        
        # Process the webhook
        customer_reference = webhook_data.get('customer_reference')
        payment_status = webhook_data.get('status')
        internal_reference = webhook_data.get('internal_reference')
        
        try:
            # Find the deposit by customer reference (our tx_ref)
            deposit = Deposit.objects.get(tx_ref=customer_reference)
            
            if deposit.status != 'PENDING':
                # Already processed, acknowledge webhook
                logger.info(f"Webhook for already processed transaction: {customer_reference}")
                return Response({'success': True, 'message': 'Already processed'}, status=status.HTTP_200_OK)
            
            if payment_status == 'success':
                with transaction.atomic():
                    # Update deposit record
                    deposit.status = 'COMPLETED'
                    deposit.transaction_id = internal_reference or deposit.transaction_id
                    deposit.save()
                    
                    # Get or create user's savings account
                    account, created = Account.objects.get_or_create(
                        user=deposit.user,
                        account_type='SAVINGS',
                        defaults={
                            'account_number': f"SAV{deposit.user.id:06d}",
                            'balance': Decimal('0.00')
                        }
                    )
                    
                    # Update account balance
                    account.balance += Decimal(str(deposit.amount))
                    account.save()
                    
                    logger.info(f"Webhook processed: {customer_reference}, amount: {deposit.amount}, new balance: {account.balance}")
                    
                    # TODO: Send email notification to user
                    
            elif payment_status in ['failed', 'cancelled']:
                deposit.status = 'FAILED'
                deposit.save()
                logger.info(f"Webhook: Payment failed for {customer_reference}")
            
            # Acknowledge webhook
            return Response({'success': True}, status=status.HTTP_200_OK)
            
        except Deposit.DoesNotExist:
            logger.error(f"Webhook: Deposit not found for reference {customer_reference}")
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Webhook error: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
