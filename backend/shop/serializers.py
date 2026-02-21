from rest_framework import serializers
from .models import (
    ProductCategory, Product, Cart, CartItem, Order, OrderItem, ProductReview,
)


class ProductCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image',
                  'is_active', 'sort_order', 'product_count']


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    avg_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'compare_at_price', 'image',
                  'stock', 'in_stock', 'is_featured', 'is_digital',
                  'discount_percent', 'category', 'category_name',
                  'avg_rating', 'review_count', 'created_at']


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail with reviews"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    avg_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'price', 'compare_at_price',
                  'image', 'images', 'stock', 'in_stock', 'is_featured', 'is_digital',
                  'discount_percent', 'tags', 'category', 'category_name',
                  'avg_rating', 'review_count', 'reviews', 'created_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal', 'added_at']
        read_only_fields = ['id', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'price',
                  'quantity', 'subtotal']
        read_only_fields = ['id']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'status_display',
                  'payment_method', 'payment_display', 'subtotal',
                  'shipping_fee', 'total', 'shipping_address', 'phone',
                  'notes', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'order_number', 'subtotal', 'total', 'created_at', 'updated_at']


class CheckoutSerializer(serializers.Serializer):
    """Validates checkout input"""
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_CHOICES, default='WALLET')
    shipping_address = serializers.CharField(required=True, max_length=500)
    phone = serializers.CharField(required=True, max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
