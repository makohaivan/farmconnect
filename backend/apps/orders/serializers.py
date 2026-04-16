from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['id', 'product_name', 'quantity', 'unit', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items       = OrderItemSerializer(many=True, read_only=True)
    buyer_name  = serializers.SerializerMethodField()
    farmer_name = serializers.SerializerMethodField()
    farm_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'status', 'total_amount', 'delivery_address',
            'notes', 'created_at', 'updated_at',
            'items', 'buyer_name', 'farmer_name', 'farm_name',
        ]

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name()

    def get_farmer_name(self, obj):
        return obj.farmer.get_full_name()

    def get_farm_name(self, obj):
        try:
            return obj.farmer.farmerprofile.farm_name
        except Exception:
            return ''


class PlaceOrderSerializer(serializers.Serializer):
    """
    Validates the order payload from the checkout page.

    Expected format:
    {
        "delivery_address": "Plot 23, Kampala",
        "notes": "optional",
        "items": [
            { "product_id": 1, "quantity": 2, "unit_price": 3000 }
        ]
    }
    """
    delivery_address = serializers.CharField(min_length=5)
    notes            = serializers.CharField(required=False, allow_blank=True, default='')
    items            = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )

    def validate_items(self, items):
        from apps.products.models import Product

        if not items:
            raise serializers.ValidationError("Cart is empty.")

        validated = []
        for item in items:
            # product_id can come as int or string from JS — handle both
            try:
                product_id = int(item.get('product_id', 0))
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Invalid product_id: {item.get('product_id')}"
                )

            # quantity same — JS may send as float
            try:
                quantity = int(float(item.get('quantity', 0)))
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Invalid quantity: {item.get('quantity')}"
                )

            if product_id <= 0:
                raise serializers.ValidationError("Invalid product_id.")

            if quantity <= 0:
                raise serializers.ValidationError("Quantity must be at least 1.")

            # Look up the product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product with id {product_id} does not exist."
                )

            if not product.is_available:
                raise serializers.ValidationError(
                    f'"{product.name}" is no longer available.'
                )

            if product.quantity < quantity:
                raise serializers.ValidationError(
                    f'Only {product.quantity} {product.unit} of '
                    f'"{product.name}" left in stock. '
                    f'You requested {quantity}.'
                )

            validated.append({
                'product':  product,
                'quantity': quantity,
            })

        return validated
