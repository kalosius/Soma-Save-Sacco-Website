from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet, AccountViewSet, DepositViewSet, ShareTransactionViewSet,
    LoginActivityViewSet, BorrowerViewSet, LoanViewSet, PaymentViewSet,
    RepaymentScheduleViewSet, ReportViewSet, NationalIDVerificationViewSet,
    UniversityViewSet, CourseViewSet,
    RegisterView, LoginView, LogoutView, CurrentUserView, DashboardStatsView
)

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'accounts', AccountViewSet)
router.register(r'deposits', DepositViewSet)
router.register(r'shares', ShareTransactionViewSet)
router.register(r'login-activities', LoginActivityViewSet)
router.register(r'borrowers', BorrowerViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'repayment-schedules', RepaymentScheduleViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'national-id-verifications', NationalIDVerificationViewSet)
router.register(r'universities', UniversityViewSet)
router.register(r'courses', CourseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
