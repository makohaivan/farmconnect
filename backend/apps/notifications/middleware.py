"""
JWT Authentication Middleware for WebSocket connections.

Regular HTTP requests use the Authorization header.
WebSocket connections cannot set headers easily, so we pass
the JWT token as a query parameter: ?token=xxx

This middleware extracts the token, validates it, and attaches
the user to the scope so the consumer can access it.
"""
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def get_user_from_token(token):
    """Validate JWT and return the user, or AnonymousUser if invalid."""
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from apps.accounts.models import User

        validated = AccessToken(token)
        user_id   = validated.get('user_id')
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    """Attach authenticated user to WebSocket scope."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Extract token from query string: ws://...?token=xxx
        query_string = scope.get('query_string', b'').decode()
        params       = parse_qs(query_string)
        token_list   = params.get('token', [])

        if token_list:
            scope['user'] = await get_user_from_token(token_list[0])
        else:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)
