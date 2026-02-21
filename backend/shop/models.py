from django.db import models
from api.models import CustomUser


class ProductCategory(models.Model):
    """Product category model"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=50, blank=True, default='category')  # Material icon name
    image = models.URLField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shop_category'
        verbose_name_plural = 'Product Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """Product listing"""
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                            help_text='Original price before discount')
    image = models.URLField(max_length=500, null=True, blank=True)
    images = models.JSONField(default=list, blank=True, help_text='Additional image URLs')
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_digital = models.BooleanField(default=False, help_text='Digital product (no shipping)')
    tags = models.CharField(max_length=500, blank=True, default='', help_text='Comma-separated tags')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shop_product'
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return int(((self.compare_at_price - self.price) / self.compare_at_price) * 100)
        return 0


class Cart(models.Model):
    """Shopping cart tied to a user"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shop_cart'

    def __str__(self):
        return f"Cart – {self.user.username}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Individual item inside a cart"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shop_cart_item'
        unique_together = ('cart', 'product')

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def subtotal(self):
        return self.product.price * self.quantity


class Order(models.Model):
    """Completed order"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('WALLET', 'Savings Wallet'),
        ('MOBILE_MONEY', 'Mobile Money'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='WALLET')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_address = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shop_order'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} – {self.user.username}"


class OrderItem(models.Model):
    """Line item in an order (snapshot of product at purchase time)"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=200)
    product_image = models.URLField(max_length=500, null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'shop_order_item'

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def subtotal(self):
        return self.price * self.quantity


class ProductReview(models.Model):
    """Product review / rating"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveIntegerField(default=5)  # 1-5
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shop_review'
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.product.name} ({self.rating}★)"
