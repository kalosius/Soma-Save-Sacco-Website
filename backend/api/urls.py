from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomUserViewSet, AccountViewSet, DepositViewSet, ShareTransactionViewSet,
    LoginActivityViewSet, BorrowerViewSet, LoanViewSet, PaymentViewSet,
    RepaymentScheduleViewSet, ReportViewSet, NationalIDVerificationViewSet,
    UniversityViewSet, CourseViewSet, PushSubscriptionViewSet, PushNotificationViewSet,
    RegisterView, LoginView, LogoutView, CurrentUserView, DashboardStatsView,
    PasswordResetRequestView, PasswordResetConfirmView, TestEmailConfigView,
    InitiateDepositView, VerifyDepositView, RelworxWebhookView
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
router.register(r'push-subscriptions', PushSubscriptionViewSet, basename='push-subscription')
router.register(r'push-notifications', PushNotificationViewSet, basename='push-notification')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('test/email-config/', TestEmailConfigView.as_view(), name='test-email-config'),
    path('payment-requests/initiate-deposit/', InitiateDepositView.as_view(), name='initiate-deposit'),
    path('payment-requests/verify-deposit/', VerifyDepositView.as_view(), name='verify-deposit'),
    path('payment-requests/relworx-webhook/', RelworxWebhookView.as_view(), name='relworx-webhook'),
]