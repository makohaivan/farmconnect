import traceback
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import Order, OrderItem
from apps.notifications.utils import notify_farmer_new_order, notify_buyer_status_change
from .serializers import OrderSerializer, PlaceOrderSerializer
from apps.accounts.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    """POST /api/v1/orders/ — Buyer places an order."""

    # 1. Role check
    if request.user.role != User.ROLE_BUYER:
        return Response(
            {'error': 'Only buyers can place orders.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # 2. Validate incoming data
    serializer = PlaceOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': str(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )

    validated_items  = serializer.validated_data['items']
    delivery_address = serializer.validated_data['delivery_address']
    notes            = serializer.validated_data.get('notes', '')

    # 3. Group items by farmer (one order created per farmer)
    by_farmer = {}
    for item in validated_items:
        fid = item['product'].farmer_id
        if fid not in by_farmer:
            by_farmer[fid] = []
        by_farmer[fid].append(item)

    orders_created = []

    try:
        with transaction.atomic():
            for farmer_id, farmer_items in by_farmer.items():
                farmer = User.objects.get(id=farmer_id)

                # Sum up total for this farmer's portion
                total = sum(
                    item['product'].price * item['quantity']
                    for item in farmer_items
                )

                # Create the order
                order = Order.objects.create(
                    buyer            = request.user,
                    farmer           = farmer,
                    delivery_address = delivery_address,
                    notes            = notes,
                    total_amount     = total,
                )

                # Create order items + reduce stock
                for item in farmer_items:
                    product = item['product']
                    qty     = item['quantity']

                    OrderItem.objects.create(
                        order        = order,
                        product      = product,
                        product_name = product.name,
                        quantity     = qty,
                        unit         = product.unit,
                        unit_price   = product.price,
                    )

                    # Reduce stock
                    product.quantity = max(0, product.quantity - qty)
                    if product.quantity == 0:
                        product.is_available = False
                    product.save(update_fields=['quantity', 'is_available'])

                orders_created.append(order)
                # Notify farmer immediately
                try:
                    notify_farmer_new_order(order)
                except Exception:
                    pass

    except Exception as e:
        # Log the full error in the Django console
        traceback.print_exc()
        return Response(
            {'error': f'Order could not be saved: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Return the first order (buyer usually orders from one farmer at a time)
    return Response(
        OrderSerializer(orders_created[0]).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buyer_orders(request):
    """GET /api/v1/orders/buyer/ — All orders placed by this buyer."""
    if request.user.role != User.ROLE_BUYER:
        return Response({'error': 'Buyers only.'}, status=403)

    orders = Order.objects.filter(
        buyer=request.user
    ).prefetch_related('items').select_related('farmer', 'farmer__farmerprofile')

    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    return Response({
        'count':   orders.count(),
        'results': OrderSerializer(orders, many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def farmer_orders(request):
    """GET /api/v1/orders/farmer/ — All orders received by this farmer."""
    if request.user.role != User.ROLE_FARMER:
        return Response({'error': 'Farmers only.'}, status=403)

    orders = Order.objects.filter(
        farmer=request.user
    ).prefetch_related('items').select_related('buyer')

    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    return Response({
        'count':   orders.count(),
        'results': OrderSerializer(orders, many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """GET /api/v1/orders/<id>/ — Full details of one order."""
    order = get_object_or_404(Order, id=order_id)

    if request.user not in (order.buyer, order.farmer):
        return Response({'error': 'Not authorised.'}, status=403)

    return Response(OrderSerializer(order).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """PATCH /api/v1/orders/<id>/status/ — Farmer advances status."""
    order = get_object_or_404(Order, id=order_id, farmer=request.user)

    VALID_TRANSITIONS = {
        'pending':    'confirmed',
        'confirmed':  'packed',
        'packed':     'dispatched',
        'dispatched': 'delivered',
    }

    new_status = request.data.get('status')
    expected   = VALID_TRANSITIONS.get(order.status)

    if not expected:
        return Response(
            {'error': 'This order cannot be advanced further.'},
            status=400
        )

    if new_status != expected:
        return Response(
            {'error': f'Next valid status is "{expected}", got "{new_status}".'},
            status=400
        )

    order.status = new_status
    order.save()
    # Notify buyer of status change
    try:
        notify_buyer_status_change(order, new_status)
    except Exception:
        pass
    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """POST /api/v1/orders/<id>/cancel/ — Buyer cancels a pending order."""
    order = get_object_or_404(Order, id=order_id, buyer=request.user)

    if order.status != 'pending':
        return Response(
            {'error': 'Only pending orders can be cancelled.'},
            status=400
        )

    with transaction.atomic():
        # Restore stock for each item
        for item in order.items.select_related('product').all():
            if item.product:
                item.product.quantity    += item.quantity
                item.product.is_available = True
                item.product.save(update_fields=['quantity', 'is_available'])

        order.status = 'cancelled'
        order.save()

    # Notify buyer
    try:
        notify_buyer_status_change(order, 'cancelled')
    except Exception:
        pass

    return Response({'message': 'Order cancelled successfully.'})


# ══════════════════════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_review(request):
    """
    POST /api/v1/orders/review/
    Buyer posts a review for a product after the order is delivered.
    Body: { order_id, product_id, rating (1-5), comment }
    """
    if request.user.role != User.ROLE_BUYER:
        return Response({'error': 'Only buyers can post reviews.'}, status=403)

    order_id   = request.data.get('order_id')
    product_id = request.data.get('product_id')
    rating     = request.data.get('rating')
    comment    = request.data.get('comment', '')

    # Validate
    if not all([order_id, product_id, rating]):
        return Response({'error': 'order_id, product_id and rating are required.'}, status=400)

    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except (ValueError, TypeError):
        return Response({'error': 'Rating must be a number between 1 and 5.'}, status=400)

    # Order must exist, belong to this buyer, and be delivered
    order = get_object_or_404(Order, id=order_id, buyer=request.user)
    if order.status != 'delivered':
        return Response(
            {'error': 'You can only review products from delivered orders.'},
            status=400
        )

    # Product must be in the order
    if not order.items.filter(product_id=product_id).exists():
        return Response(
            {'error': 'This product is not in the specified order.'},
            status=400
        )

    from apps.products.models import Product
    product = get_object_or_404(Product, id=product_id)

    from .models import Review
    review, created = Review.objects.get_or_create(
        buyer=request.user, product=product, order=order,
        defaults={'rating': rating, 'comment': comment}
    )

    if not created:
        # Update existing review
        review.rating  = rating
        review.comment = comment
        review.save()

    return Response({
        'message':    'Review saved successfully.',
        'id':         review.id,
        'rating':     review.rating,
        'comment':    review.comment,
        'created_at': review.created_at,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_reviews(request, product_id):
    """GET /api/v1/orders/reviews/<product_id>/ — All reviews for a product."""
    from .models import Review
    from apps.products.models import Product

    product = get_object_or_404(Product, id=product_id)
    reviews = Review.objects.filter(product=product).select_related('buyer')

    data = [{
        'id':          r.id,
        'buyer_name':  r.buyer.get_full_name(),
        'rating':      r.rating,
        'comment':     r.comment,
        'created_at':  r.created_at,
    } for r in reviews]

    avg = sum(r['rating'] for r in data) / len(data) if data else 0

    return Response({
        'product_id':    product_id,
        'average_rating': round(avg, 1),
        'total_reviews':  len(data),
        'reviews':        data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_orders(request):
    """
    GET /api/v1/orders/all/
    Admin only — view all orders platform-wide.
    """
    from apps.accounts.models import User as UserModel
    if request.user.role != UserModel.ROLE_ADMIN:
        return Response({'error': 'Admin access required.'}, status=403)

    orders = Order.objects.all().select_related(
        'buyer', 'farmer', 'farmer__farmerprofile'
    ).prefetch_related('items').order_by('-created_at')

    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    return Response({
        'count':   orders.count(),
        'results': OrderSerializer(orders, many=True).data,
    })
