from django.shortcuts import render
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
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
    UniversitySerializer, CourseSerializer
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


class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
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
            
            # Get user's accounts
            accounts = Account.objects.filter(user=user)
            
            return Response({
                'message': 'Login successful',
                'user': CustomUserSerializer(user).data,
                'accounts': AccountSerializer(accounts, many=True).data
            })
        
        return Response(
            {'error': 'Invalid credentials. Please check your email/student ID and password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        accounts = Account.objects.filter(user=request.user)
        
        return Response({
            'user': CustomUserSerializer(request.user).data,
            'accounts': AccountSerializer(accounts, many=True).data
        })
