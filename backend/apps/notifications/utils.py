"""
FarmConnect — Notification Utilities

Call these functions whenever an event happens that needs a notification.
They save to DB and push via WebSocket simultaneously.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def create_and_send(user, notif_type, title, message, order_id=None):
    """
    Save a notification to the database AND push it to the user's
    WebSocket channel in real time.

    If the user is not currently connected, they will see it
    the next time they open the app (loaded on WS connect).
    """
    from .models import Notification

    # Save to DB
    notif = Notification.objects.create(
        user     = user,
        type     = notif_type,
        title    = title,
        message  = message,
        order_id = order_id,
    )

    # Push via WebSocket (non-blocking)
    try:
        channel_layer = get_channel_layer()
        group_name    = f'notifications_{user.id}'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type':         'notification_message',
                'notification': {
                    'id':         notif.id,
                    'type':       notif.type,
                    'title':      notif.title,
                    'message':    notif.message,
                    'order_id':   notif.order_id,
                    'is_read':    notif.is_read,
                    'created_at': notif.created_at.isoformat(),
                }
            }
        )
    except Exception:
        # WebSocket push failing should never break the main request
        pass

    return notif


# ── Notification templates ────────────────────────────────────────────────────

def notify_farmer_new_order(order):
    """Tell farmer they received a new order."""
    create_and_send(
        user      = order.farmer,
        notif_type= 'order_placed',
        title     = 'New Order Received! 🎉',
        message   = (
            f"{order.buyer.get_full_name()} placed an order worth "
            f"UGX {int(order.total_amount):,}. "
            f"Confirm it to get started."
        ),
        order_id  = order.id,
    )


def notify_buyer_status_change(order, new_status):
    """Tell buyer their order status changed."""
    STATUS_MESSAGES = {
        'confirmed':  ('Order Confirmed ✅', f'Your order #{order.id} has been confirmed by the farmer. They are preparing it for you.'),
        'packed':     ('Order Packed 📦',    f'Your order #{order.id} has been packed and is ready for dispatch.'),
        'dispatched': ('Order On the Way 🚚', f'Great news! Your order #{order.id} is on its way to you.'),
        'delivered':  ('Order Delivered 🎉', f'Your order #{order.id} has been delivered. Enjoy your fresh produce! Leave a review.'),
        'cancelled':  ('Order Cancelled ❌', f'Your order #{order.id} has been cancelled. Your cart items have been restored.'),
    }

    if new_status not in STATUS_MESSAGES:
        return

    title, message = STATUS_MESSAGES[new_status]

    create_and_send(
        user      = order.buyer,
        notif_type= f'order_{new_status}',
        title     = title,
        message   = message,
        order_id  = order.id,
    )
