"""
FarmConnect — WebSocket Consumer

Each authenticated user connects to their personal notification channel.
When an event happens (order placed, status changed), we send a message
to that channel and it appears instantly in the browser.

Channel naming: notifications_{user_id}
This ensures each user only receives their own notifications.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        """
        Called when a browser opens a WebSocket connection.
        We authenticate using the JWT token passed as a query parameter.
        """
        self.user = self.scope.get('user')

        # Reject unauthenticated connections
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Each user has their own personal group
        self.group_name = f'notifications_{self.user.id}'

        # Join the group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

        # Send any unread notifications on connect so the user
        # sees missed notifications immediately
        unread = await self.get_unread_notifications()
        if unread:
            await self.send(text_data=json.dumps({
                'type':          'unread_notifications',
                'notifications': unread,
            }))

    async def disconnect(self, close_code):
        """Called when the browser closes the connection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Called when browser sends a message to us.
        We use this for marking notifications as read.
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get('type') == 'mark_read':
            notification_id = data.get('notification_id')
            if notification_id:
                await self.mark_notification_read(notification_id)

        elif data.get('type') == 'mark_all_read':
            await self.mark_all_read()

    async def notification_message(self, event):
        """
        Called when our group receives a message from the server side.
        Forwards it to the browser.
        """
        await self.send(text_data=json.dumps({
            'type':         'new_notification',
            'notification': event['notification'],
        }))

    # ── Database helpers ──────────────────────────────────────────────────────

    @database_sync_to_async
    def get_unread_notifications(self):
        from .models import Notification
        notifications = Notification.objects.filter(
            user=self.user,
            is_read=False
        ).order_by('-created_at')[:20]

        return [{
            'id':         n.id,
            'type':       n.type,
            'title':      n.title,
            'message':    n.message,
            'order_id':   n.order_id,
            'is_read':    n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in notifications]

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from .models import Notification
        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True)

    @database_sync_to_async
    def mark_all_read(self):
        from .models import Notification
        Notification.objects.filter(
            user=self.user,
            is_read=False
        ).update(is_read=True)
