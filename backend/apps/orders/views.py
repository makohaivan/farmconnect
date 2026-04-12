from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem
from .serializers import OrderSerializer, PlaceOrderSerializer
from apps.accounts.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    """
    POST /api/v1/orders/
    Buyer places an order. Creates one Order per farmer in the cart.
    Uses a database transaction so either everything saves or nothing does.
    """
    if request.user.role != User.ROLE_BUYER:
        return Response({'error': 'Only buyers can place orders.'}, status=403)

    serializer = PlaceOrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    validated_items  = serializer.validated_data['items']
    delivery_address = serializer.validated_data['delivery_address']
    notes            = serializer.validated_data.get('notes', '')

    # Group items by farmer — one order per farmer
    by_farmer = {}
    for item in validated_items:
        farmer_id = item['product'].farmer_id
        if farmer_id not in by_farmer:
            by_farmer[farmer_id] = []
        by_farmer[farmer_id].append(item)

    orders_created = []

    with transaction.atomic():
        for farmer_id, farmer_items in by_farmer.items():
            farmer = User.objects.get(id=farmer_id)

            # Calculate total for this farmer's items
            total = sum(
                item['product'].price * item['quantity']
                for item in farmer_items
            )

            order = Order.objects.create(
                buyer=request.user,
                farmer=farmer,
                delivery_address=delivery_address,
                notes=notes,
                total_amount=total,
            )

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
                product.quantity -= qty
                if product.quantity == 0:
                    product.is_available = False
                product.save()

            orders_created.append(order)

    # Return the first order (most common case: one farmer per cart)
    return Response(
        OrderSerializer(orders_created[0]).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buyer_orders(request):
    """GET /api/v1/orders/buyer/ — Buyer's own orders."""
    if request.user.role != User.ROLE_BUYER:
        return Response({'error': 'Buyers only.'}, status=403)

    orders = Order.objects.filter(
        buyer=request.user
    ).prefetch_related('items').select_related('farmer', 'farmer__farmerprofile')

    # Optional status filter
    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    serializer = OrderSerializer(orders, many=True)
    return Response({'count': orders.count(), 'results': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def farmer_orders(request):
    """GET /api/v1/orders/farmer/ — Farmer's received orders."""
    if request.user.role != User.ROLE_FARMER:
        return Response({'error': 'Farmers only.'}, status=403)

    orders = Order.objects.filter(
        farmer=request.user
    ).prefetch_related('items').select_related('buyer')

    status_filter = request.query_params.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)

    serializer = OrderSerializer(orders, many=True)
    return Response({'count': orders.count(), 'results': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):
    """GET /api/v1/orders/<id>/ — Get one order."""
    order = get_object_or_404(Order, id=order_id)

    # Only buyer or farmer of this order can see it
    if request.user != order.buyer and request.user != order.farmer:
        return Response({'error': 'Not authorised.'}, status=403)

    return Response(OrderSerializer(order).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """PATCH /api/v1/orders/<id>/status/ — Farmer advances order status."""
    order = get_object_or_404(Order, id=order_id, farmer=request.user)

    VALID_TRANSITIONS = {
        'pending':    'confirmed',
        'confirmed':  'packed',
        'packed':     'dispatched',
        'dispatched': 'delivered',
    }

    new_status = request.data.get('status')
    expected   = VALID_TRANSITIONS.get(order.status)

    if new_status != expected:
        return Response(
            {'error': f'Invalid transition. Expected: {expected}'},
            status=400
        )

    order.status = new_status
    order.save()
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

    # Restore product stock
    with transaction.atomic():
        for item in order.items.all():
            if item.product:
                item.product.quantity += item.quantity
                item.product.is_available = True
                item.product.save()

        order.status = 'cancelled'
        order.save()

    return Response({'message': 'Order cancelled successfully.'})
