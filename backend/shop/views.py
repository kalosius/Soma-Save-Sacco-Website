import uuid
from decimal import Decimal

from django.db.models import Avg, Count
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    ProductCategory, Product, Cart, CartItem, Order, OrderItem, ProductReview,
)
from .serializers import (
    ProductCategorySerializer, ProductListSerializer, ProductDetailSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, CheckoutSerializer,
    ProductReviewSerializer,
)


# ──────────────────────────────────────────────────────────
#  PUBLIC — Categories & Products (browsable without login)
# ──────────────────────────────────────────────────────────

class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            ProductCategory.objects
            .filter(is_active=True)
            .annotate(product_count=Count('products', filter=models_Q(products__is_active=True)))
        )


# We need the Q import for filtering
from django.db.models import Q as models_Q  # noqa: E402


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        qs = (
            Product.objects
            .filter(is_active=True)
            .select_related('category')
            .annotate(
                avg_rating=Avg('reviews__rating'),
                review_count=Count('reviews'),
            )
        )
        # Optional filters via query params
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                models_Q(name__icontains=search) |
                models_Q(description__icontains=search) |
                models_Q(tags__icontains=search)
            )

        featured = self.request.query_params.get('featured')
        if featured == '1':
            qs = qs.filter(is_featured=True)

        sort = self.request.query_params.get('sort')
        if sort == 'price_asc':
            qs = qs.order_by('price')
        elif sort == 'price_desc':
            qs = qs.order_by('-price')
        elif sort == 'newest':
            qs = qs.order_by('-created_at')
        elif sort == 'rating':
            qs = qs.order_by('-avg_rating')

        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def review(self, request, slug=None):
        """Add or update a review for this product"""
        product = self.get_object()
        rating = request.data.get('rating', 5)
        comment = request.data.get('comment', '')
        try:
            rating = min(max(int(rating), 1), 5)
        except (ValueError, TypeError):
            rating = 5

        review, created = ProductReview.objects.update_or_create(
            product=product, user=request.user,
            defaults={'rating': rating, 'comment': comment},
        )
        return Response(
            ProductReviewSerializer(review).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ──────────────────────────────────────────────────────────
#  CART  (requires login)
# ──────────────────────────────────────────────────────────

class CartView(views.APIView):
    """Get the current user's cart"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        # Annotate products inside cart items
        cart_items = cart.items.select_related('product__category').all()
        # Re-annotate products for the serializer
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemView(views.APIView):
    """Add / update / remove items in the cart"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Add item to cart (or increase qty)"""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if product.stock < quantity:
            return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product,
            defaults={'quantity': quantity},
        )
        if not created:
            item.quantity += quantity
            if item.quantity > product.stock:
                return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)
            item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update item quantity"""
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            cart = Cart.objects.get(user=request.user)
            item = CartItem.objects.get(id=item_id, cart=cart)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        if quantity <= 0:
            item.delete()
        else:
            if quantity > item.product.stock:
                return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request):
        """Remove item from cart"""
        item_id = request.query_params.get('item_id')
        try:
            cart = Cart.objects.get(user=request.user)
            CartItem.objects.filter(id=item_id, cart=cart).delete()
        except Cart.DoesNotExist:
            pass
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)


# ──────────────────────────────────────────────────────────
#  CHECKOUT & ORDERS
# ──────────────────────────────────────────────────────────

class CheckoutView(views.APIView):
    """Convert the cart into an order"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db import transaction as db_transaction

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        items = cart.items.select_related('product').all()
        if not items.exists():
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Check stock for every item
        for ci in items:
            if ci.quantity > ci.product.stock:
                return Response(
                    {'error': f'"{ci.product.name}" only has {ci.product.stock} left in stock'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Calculate totals
        subtotal = sum(ci.product.price * ci.quantity for ci in items)
        shipping_fee = Decimal('0.00')  # Free shipping for now
        total = subtotal + shipping_fee
        payment_method = serializer.validated_data['payment_method']

        # ── WALLET payment: deduct from savings account ──────
        if payment_method == 'WALLET':
            from api.models import Account
            account = Account.objects.filter(user=request.user).first()
            if not account or account.balance < total:
                return Response(
                    {'error': 'Insufficient wallet balance. Please top up your savings first.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ── PAYPAL payment: create order as PENDING, return PayPal order ─
        if payment_method == 'PAYPAL':
            from api.paypal import PayPalGateway

            order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"

            with db_transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    order_number=order_number,
                    status='PENDING',
                    payment_method='PAYPAL',
                    subtotal=subtotal,
                    shipping_fee=shipping_fee,
                    total=total,
                    shipping_address=serializer.validated_data['shipping_address'],
                    phone=serializer.validated_data['phone'],
                    notes=serializer.validated_data.get('notes', ''),
                )
                for ci in items:
                    OrderItem.objects.create(
                        order=order,
                        product=ci.product,
                        product_name=ci.product.name,
                        product_image=ci.product.image,
                        price=ci.product.price,
                        quantity=ci.quantity,
                    )

            # Create PayPal order
            paypal = PayPalGateway()
            # Convert UGX total to USD for PayPal (approximate rate)
            usd_amount = float(total) / 3700  # 1 USD ≈ 3700 UGX
            if usd_amount < 1:
                usd_amount = 1.00
            result = paypal.create_order(
                amount=usd_amount,
                currency='USD',
                description=f"SomaSave Shop Order {order_number}",
                reference_id=order_number,
            )
            if not result['success']:
                order.status = 'CANCELLED'
                order.save()
                return Response(
                    {'error': result.get('error', 'Failed to create PayPal order')},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order.paypal_order_id = result['order_id']
            order.save()

            return Response({
                'paypal': True,
                'order_id': result['order_id'],
                'shop_order_id': order.id,
                'order_number': order_number,
                'total': float(total),
                'usd_total': round(usd_amount, 2),
            }, status=status.HTTP_201_CREATED)

        # ── WALLET / MOBILE_MONEY: immediate order creation ─
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        with db_transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                order_number=order_number,
                status='CONFIRMED',
                payment_method=payment_method,
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                total=total,
                shipping_address=serializer.validated_data['shipping_address'],
                phone=serializer.validated_data['phone'],
                notes=serializer.validated_data.get('notes', ''),
            )

            # Create order items and decrement stock
            for ci in items:
                OrderItem.objects.create(
                    order=order,
                    product=ci.product,
                    product_name=ci.product.name,
                    product_image=ci.product.image,
                    price=ci.product.price,
                    quantity=ci.quantity,
                )
                ci.product.stock -= ci.quantity
                ci.product.save(update_fields=['stock'])

            # Deduct from wallet if WALLET payment
            if payment_method == 'WALLET':
                from api.models import Account
                account = Account.objects.select_for_update().filter(user=request.user).first()
                account.balance -= total
                account.save(update_fields=['balance'])

            # Clear cart
            cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class ShopPayPalCaptureView(views.APIView):
    """Capture PayPal payment for a shop order"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import logging
        from django.db import transaction as db_transaction
        from api.paypal import PayPalGateway

        logger = logging.getLogger(__name__)

        paypal_order_id = request.data.get('order_id')
        shop_order_id = request.data.get('shop_order_id')

        if not paypal_order_id:
            return Response({'error': 'PayPal order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=shop_order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.status == 'CONFIRMED':
            return Response(OrderSerializer(order).data)

        # Capture PayPal order
        paypal = PayPalGateway()
        result = paypal.capture_order(paypal_order_id)

        if not result['success']:
            order.status = 'CANCELLED'
            order.save()
            logger.error(f"Shop PayPal capture failed for {paypal_order_id}: {result.get('error')}")
            return Response(
                {'error': result.get('error', 'Payment capture failed')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if result['status'] == 'COMPLETED':
            with db_transaction.atomic():
                order.status = 'CONFIRMED'
                order.save()

                # Decrement stock
                for item in order.items.select_related('product').all():
                    if item.product:
                        item.product.stock -= item.quantity
                        item.product.save(update_fields=['stock'])

                # Clear the cart
                try:
                    cart = Cart.objects.get(user=request.user)
                    cart.items.all().delete()
                except Cart.DoesNotExist:
                    pass

            logger.info(f"Shop PayPal payment captured for order {order.order_number}")
            return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
        else:
            order.status = 'CANCELLED'
            order.save()
            return Response(
                {'error': 'Payment was not completed', 'status': result['status']},
                status=status.HTTP_400_BAD_REQUEST,
            )


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """List / retrieve orders for the logged-in user"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related('items')
        )
