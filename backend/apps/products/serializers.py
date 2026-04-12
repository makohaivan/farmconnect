"""
FarmConnect - Product Serializers
"""
from rest_framework import serializers
from .models import Product, Category
from apps.accounts.models import User


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'icon', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_available=True).count()


class FarmerMiniSerializer(serializers.ModelSerializer):
    farm_name = serializers.SerializerMethodField()
    location  = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'first_name', 'last_name', 'farm_name', 'location']

    def get_farm_name(self, obj):
        if hasattr(obj, 'farmerprofile'):
            return obj.farmerprofile.farm_name
        return ''

    def get_location(self, obj):
        if hasattr(obj, 'farmerprofile'):
            return obj.farmerprofile.location
        return ''


class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer — used for detail views and farmer's own listings."""
    farmer        = FarmerMiniSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    image_url     = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'price', 'quantity', 'unit',
            'image', 'image_url', 'is_available', 'is_featured',
            'views_count', 'created_at', 'updated_at',
            'farmer', 'category', 'category_name', 'category_icon',
        ]
        read_only_fields = ['id', 'farmer', 'views_count', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductCreateSerializer(serializers.ModelSerializer):
    """Used when a farmer creates or updates a product."""
    class Meta:
        model  = Product
        fields = [
            'name', 'description', 'price', 'quantity',
            'unit', 'image', 'category', 'is_available',
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

    def validate_category(self, value):
        if not value:
            raise serializers.ValidationError("Please select a category.")
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product catalog listing."""
    farmer_name = serializers.SerializerMethodField()
    farm_name   = serializers.SerializerMethodField()
    location    = serializers.SerializerMethodField()
    category_name= serializers.CharField(source='category.name', read_only=True)
    category_icon= serializers.CharField(source='category.icon', read_only=True)
    image_url   = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'price', 'quantity', 'unit',
            'image_url', 'is_available', 'is_featured',
            'farmer_name', 'farm_name', 'location',
            'category_name', 'category_icon', 'created_at',
        ]

    def get_farmer_name(self, obj): return obj.farmer.get_full_name()
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
    def get_farm_name(self, obj):
        if hasattr(obj.farmer, 'farmerprofile'):
            return obj.farmer.farmerprofile.farm_name
        return ''
    def get_location(self, obj):
        if hasattr(obj.farmer, 'farmerprofile'):
            return obj.farmer.farmerprofile.location
        return ''
