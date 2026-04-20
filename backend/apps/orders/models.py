from django.db import models
from apps.accounts.models import User
from apps.products.models import Product


class Order(models.Model):
    STATUS_PENDING    = 'pending'
    STATUS_CONFIRMED  = 'confirmed'
    STATUS_PACKED     = 'packed'
    STATUS_DISPATCHED = 'dispatched'
    STATUS_DELIVERED  = 'delivered'
    STATUS_CANCELLED  = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING,    'Pending'),
        (STATUS_CONFIRMED,  'Confirmed'),
        (STATUS_PACKED,     'Packed'),
        (STATUS_DISPATCHED, 'Dispatched'),
        (STATUS_DELIVERED,  'Delivered'),
        (STATUS_CANCELLED,  'Cancelled'),
    ]

    buyer            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    farmer           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_amount     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_address = models.TextField()
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} — {self.buyer.get_full_name()} → {self.farmer.get_full_name()}"


class OrderItem(models.Model):
    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product      = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=200)  # snapshot
    quantity     = models.PositiveIntegerField()
    unit         = models.CharField(max_length=20)
    unit_price   = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal     = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'order_items'

    def save(self, *args, **kwargs):
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"


class Review(models.Model):
    """
    Buyer reviews a product after order is delivered.
    One review per order item — prevents duplicate reviews.
    """
    buyer      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reviews')
    rating     = models.PositiveSmallIntegerField()   # 1 to 5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        unique_together = ['buyer', 'product', 'order']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}★ by {self.buyer.get_full_name()} on {self.product.name}"
