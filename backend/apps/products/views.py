"""
FarmConnect - Product Views
Full CRUD for products + public catalog browsing
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Product, Category
from .serializers import (
    ProductSerializer, ProductListSerializer,
    ProductCreateSerializer, CategorySerializer,
)
from apps.accounts.models import User


def is_farmer(user):
    return user.is_authenticated and user.role == User.ROLE_FARMER


# ── Categories ────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    """GET /api/v1/products/categories/ — List all categories."""
    cats = Category.objects.all()
    return Response(CategorySerializer(cats, many=True).data)


# ── Public Product Catalog ────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    """
    GET /api/v1/products/
    Browse all available products.
    Supports: ?category=1 &search=tomato &min_price=100 &max_price=500
              &location=kampala &ordering=-price
    """
    products = Product.objects.filter(
        is_available=True
    ).select_related('farmer', 'farmer__farmerprofile', 'category')

    # Filter by category
    category = request.query_params.get('category')
    if category:
        products = products.filter(category_id=category)

    # Search by name or description
    search = request.query_params.get('search')
    if search:
        products = products.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(farmer__farmerprofile__farm_name__icontains=search)
        )

    # Filter by location
    location = request.query_params.get('location')
    if location:
        products = products.filter(
            farmer__farmerprofile__location__icontains=location
        )

    # Price range
    min_price = request.query_params.get('min_price')
    max_price = request.query_params.get('max_price')
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # Ordering
    ordering = request.query_params.get('ordering', '-created_at')
    allowed_orderings = ['price', '-price', 'created_at', '-created_at', 'name', '-name']
    if ordering in allowed_orderings:
        products = products.order_by(ordering)

    serializer = ProductListSerializer(
        products, many=True, context={'request': request}
    )
    return Response({'count': products.count(), 'results': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, product_id):
    """
    GET /api/v1/products/<id>/
    Get full details of one product. Increments view count.
    """
    product = get_object_or_404(
        Product.objects.select_related('farmer', 'farmer__farmerprofile', 'category'),
        id=product_id
    )

    # Increment view count
    Product.objects.filter(id=product_id).update(views_count=product.views_count + 1)

    serializer = ProductSerializer(product, context={'request': request})
    return Response(serializer.data)


# ── Farmer CRUD ───────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def farmer_products(request):
    """
    GET  /api/v1/products/my-listings/ — Farmer's own products
    POST /api/v1/products/my-listings/ — Create new product
    """
    if not is_farmer(request.user):
        return Response({'error': 'Only farmers can manage products.'}, status=403)

    if request.method == 'GET':
        products = Product.objects.filter(
            farmer=request.user
        ).select_related('category').order_by('-created_at')

        # Optional filter by availability
        available = request.query_params.get('available')
        if available is not None:
            products = products.filter(is_available=available.lower() == 'true')

        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response({'count': products.count(), 'results': serializer.data})

    elif request.method == 'POST':
        serializer = ProductCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        product = serializer.save(farmer=request.user)
        return Response(
            ProductSerializer(product, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def farmer_product_detail(request, product_id):
    """
    GET    /api/v1/products/my-listings/<id>/ — Get one of farmer's products
    PATCH  /api/v1/products/my-listings/<id>/ — Update product
    DELETE /api/v1/products/my-listings/<id>/ — Delete product
    """
    if not is_farmer(request.user):
        return Response({'error': 'Only farmers can manage products.'}, status=403)

    product = get_object_or_404(Product, id=product_id, farmer=request.user)

    if request.method == 'GET':
        return Response(ProductSerializer(product, context={'request': request}).data)

    elif request.method == 'PATCH':
        serializer = ProductCreateSerializer(product, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        product = serializer.save()
        return Response(ProductSerializer(product, context={'request': request}).data)

    elif request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_availability(request, product_id):
    """POST /api/v1/products/my-listings/<id>/toggle/ — Toggle available/unavailable."""
    if not is_farmer(request.user):
        return Response({'error': 'Only farmers can manage products.'}, status=403)

    product = get_object_or_404(Product, id=product_id, farmer=request.user)
    product.is_available = not product.is_available
    product.save()
    status_str = 'available' if product.is_available else 'unavailable'
    return Response({
        'message':      f'Product marked as {status_str}.',
        'is_available': product.is_available
    })
