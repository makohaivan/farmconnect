"""
FarmConnect — Notification REST Endpoints

Used as fallback for browsers that don't support WebSockets,
and for the initial notification count in the bell icon.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification


def serialize(n):
    return {
        'id':         n.id,
        'type':       n.type,
        'title':      n.title,
        'message':    n.message,
        'order_id':   n.order_id,
        'is_read':    n.is_read,
        'created_at': n.created_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """GET /api/v1/notifications/ — Get all notifications for current user."""
    notifications = Notification.objects.filter(
        user=request.user
    ).order_by('-created_at')[:50]

    unread_count = Notification.objects.filter(
        user=request.user, is_read=False
    ).count()

    return Response({
        'unread_count':  unread_count,
        'notifications': [serialize(n) for n in notifications],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, notification_id):
    """POST /api/v1/notifications/<id>/read/ — Mark one as read."""
    Notification.objects.filter(
        id=notification_id,
        user=request.user
    ).update(is_read=True)
    return Response({'message': 'Marked as read.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """POST /api/v1/notifications/read-all/ — Mark all as read."""
    Notification.objects.filter(
        user=request.user, is_read=False
    ).update(is_read=True)
    return Response({'message': 'All notifications marked as read.'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all(request):
    """DELETE /api/v1/notifications/clear/ — Delete all notifications."""
    Notification.objects.filter(user=request.user).delete()
    return Response({'message': 'Notifications cleared.'})
