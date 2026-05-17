"""
FarmConnect — Notification Model

Stores notifications persistently so users can see them
even if they weren't online when the event happened.
"""
from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
    TYPE_ORDER_PLACED    = 'order_placed'
    TYPE_ORDER_CONFIRMED = 'order_confirmed'
    TYPE_ORDER_PACKED    = 'order_packed'
    TYPE_ORDER_DISPATCHED= 'order_dispatched'
    TYPE_ORDER_DELIVERED = 'order_delivered'
    TYPE_ORDER_CANCELLED = 'order_cancelled'

    TYPE_CHOICES = [
        (TYPE_ORDER_PLACED,     'Order Placed'),
        (TYPE_ORDER_CONFIRMED,  'Order Confirmed'),
        (TYPE_ORDER_PACKED,     'Order Packed'),
        (TYPE_ORDER_DISPATCHED, 'Order Dispatched'),
        (TYPE_ORDER_DELIVERED,  'Order Delivered'),
        (TYPE_ORDER_CANCELLED,  'Order Cancelled'),
    ]

    user       = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications'
    )
    type       = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    order_id   = models.IntegerField(null=True, blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} → {self.user.email}"
