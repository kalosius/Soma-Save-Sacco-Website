from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductCategoryViewSet, ProductViewSet, CartView, CartItemView,
    CheckoutView, OrderViewSet,
)

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='shop-category')
router.register(r'products', ProductViewSet, basename='shop-product')
router.register(r'orders', OrderViewSet, basename='shop-order')

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', CartView.as_view(), name='shop-cart'),
    path('cart/items/', CartItemView.as_view(), name='shop-cart-items'),
    path('checkout/', CheckoutView.as_view(), name='shop-checkout'),
]
