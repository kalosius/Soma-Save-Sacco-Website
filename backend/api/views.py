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
        """Update current user's profile"""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
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
        """Change user password"""
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
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password changed successfully'})


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
        
        response.delete_cookie(
            'sessionid',
            samesite='None' if is_production else 'Lax',
            secure=is_production
        )
        response.delete_cookie(
            'csrftoken',
            samesite='None' if is_production else 'Lax',
            secure=is_production
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
