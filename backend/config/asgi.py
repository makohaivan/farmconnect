"""
FarmConnect — ASGI Configuration

Handles both HTTP requests (via Django) and
WebSocket connections (via Django Channels).

HTTP  → Django handles it normally
WS    → Channels routes it to our NotificationConsumer
"""
import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from apps.notifications.middleware import JWTAuthMiddleware
from apps.notifications.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # Regular HTTP → standard Django
    "http": get_asgi_application(),

    # WebSocket → Channels with JWT auth middleware
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
