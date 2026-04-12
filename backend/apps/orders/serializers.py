from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['id', 'product_name', 'quantity', 'unit', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items        = OrderItemSerializer(many=True, read_only=True)
    buyer_name   = serializers.SerializerMethodField()
    farmer_name  = serializers.SerializerMethodField()
    farm_name    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'total_amount', 'delivery_address',
            'notes', 'created_at', 'updated_at',
            'items', 'buyer_name', 'farmer_name', 'farm_name',
        ]

    def get_buyer_name(self, obj):  return obj.buyer.get_full_name()
    def get_farmer_name(self, obj): return obj.farmer.get_full_name()
    def get_farm_name(self, obj):
        if hasattr(obj.farmer, 'farmerprofile'):
            return obj.farmer.farmerprofile.farm_name
        return ''


class PlaceOrderSerializer(serializers.Serializer):
    """Validates incoming order data from the checkout page."""
    delivery_address = serializers.CharField()
    notes            = serializers.CharField(required=False, allow_blank=True)
    items            = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )

    def validate_items(self, items):
        from apps.products.models import Product
        validated = []
        for item in items:
            try:
                product = Product.objects.get(
                    id=item['product_id'],
                    is_available=True
                )
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product {item['product_id']} is not available."
                )
            if product.quantity < item['quantity']:
                raise serializers.ValidationError(
                    f"Only {product.quantity} {product.unit} of {product.name} available."
                )
            validated.append({ 'product': product, 'quantity': item['quantity'] })
        return validated
