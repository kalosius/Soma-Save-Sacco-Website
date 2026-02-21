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

        # Create order
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        order = Order.objects.create(
            user=request.user,
            order_number=order_number,
            status='CONFIRMED',
            payment_method=serializer.validated_data['payment_method'],
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

        # Clear cart
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


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
