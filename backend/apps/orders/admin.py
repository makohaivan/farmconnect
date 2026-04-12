from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model  = OrderItem
    extra  = 0
    fields = ['product_name', 'quantity', 'unit', 'unit_price', 'subtotal']
    readonly_fields = ['subtotal']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ['id', 'buyer', 'farmer', 'status', 'total_amount', 'created_at']
    list_filter   = ['status']
    search_fields = ['buyer__email', 'farmer__email']
    inlines       = [OrderItemInline]
