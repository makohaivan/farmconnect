"""
FarmConnect - Accounts Views
Includes auth views + admin management views
"""
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError
from django.db.models import Count, Q

from .models import User, FarmerProfile, BuyerProfile
from .serializers import (
    RegisterSerializer, UserSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    AdminUserListSerializer, AdminUpdateUserSerializer,
)


# ── Custom permission: Admin role only ────────────────────────────────────────
class IsAdminRole:
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.ROLE_ADMIN

def admin_required(func):
    """Decorator that checks the user has admin role."""
    from functools import wraps
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.role != User.ROLE_ADMIN:
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        return func(request, *args, **kwargs)
    return wrapper


# ── Register ──────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    user    = serializer.save()
    refresh = RefreshToken.for_user(user)
    access  = str(refresh.access_token)

    response = Response({
        'message':      'Account created successfully.',
        'access_token': access,
        'user':         UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)

    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME, value=str(refresh),
        httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
    )
    return response


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {'error': 'Invalid email or password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data    = serializer.validated_data
        refresh = data.get('refresh')
        access  = data.get('access')
        user    = data.get('user')

        response = Response({'access_token': access, 'user': user}, status=status.HTTP_200_OK)
        response.set_cookie(
            key=settings.REFRESH_TOKEN_COOKIE_NAME, value=refresh,
            httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
            secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
            samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
            max_age=7 * 24 * 60 * 60,
        )
        return response


# ── Refresh ───────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    refresh_value = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    if not refresh_value:
        return Response({'error': 'No refresh token found.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        refresh  = RefreshToken(refresh_value)
        access   = str(refresh.access_token)
        user_id  = refresh.payload.get('user_id')
        user     = User.objects.get(id=user_id)

        response = Response({'access_token': access, 'user': UserSerializer(user).data})
        response.set_cookie(
            key=settings.REFRESH_TOKEN_COOKIE_NAME, value=str(refresh),
            httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
            secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
            samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
            max_age=7 * 24 * 60 * 60,
        )
        return response
    except TokenError:
        return Response({'error': 'Session expired. Please log in again.'}, status=status.HTTP_401_UNAUTHORIZED)


# ── Logout ────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh_value = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    if refresh_value:
        try:
            RefreshToken(refresh_value).blacklist()
        except TokenError:
            pass
    response = Response({'message': 'Logged out successfully.'})
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE_NAME)
    return response


# ── Me ────────────────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ── Update Profile ────────────────────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(UserSerializer(request.user).data)


# ── Change Password ───────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    return Response({'message': 'Password changed successfully.'})


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN VIEWS
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_stats(request):
    """
    GET /api/v1/auth/admin/stats/
    Returns platform-wide statistics for the admin dashboard.
    """
    total_users   = User.objects.count()
    total_farmers = User.objects.filter(role=User.ROLE_FARMER).count()
    total_buyers  = User.objects.filter(role=User.ROLE_BUYER).count()
    active_users  = User.objects.filter(is_active=True).count()
    inactive_users= User.objects.filter(is_active=False).count()

    # Recent signups (last 7 days)
    from django.utils import timezone
    from datetime import timedelta
    last_week    = timezone.now() - timedelta(days=7)
    new_this_week= User.objects.filter(date_joined__gte=last_week).count()

    return Response({
        'total_users':    total_users,
        'total_farmers':  total_farmers,
        'total_buyers':   total_buyers,
        'active_users':   active_users,
        'inactive_users': inactive_users,
        'new_this_week':  new_this_week,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_list_users(request):
    """
    GET /api/v1/auth/admin/users/
    List all users. Supports filtering by role and search by name/email.
    """
    users = User.objects.all().order_by('-date_joined')

    # Filter by role
    role = request.query_params.get('role')
    if role:
        users = users.filter(role=role)

    # Filter by active status
    is_active = request.query_params.get('is_active')
    if is_active is not None:
        users = users.filter(is_active=is_active.lower() == 'true')

    # Search by name or email
    search = request.query_params.get('search')
    if search:
        users = users.filter(
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )

    serializer = AdminUserListSerializer(users, many=True)
    return Response({
        'count':   users.count(),
        'results': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_get_user(request, user_id):
    """GET /api/v1/auth/admin/users/<user_id>/ — Get full details of one user."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(UserSerializer(user).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_update_user(request, user_id):
    """
    PATCH /api/v1/auth/admin/users/<user_id>/
    Admin can update role and active status of any user.
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent admin from deactivating themselves
    if user == request.user and request.data.get('is_active') == False:
        return Response({'error': 'You cannot deactivate your own account.'}, status=400)

    serializer = AdminUpdateUserSerializer(user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(UserSerializer(user).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_delete_user(request, user_id):
    """DELETE /api/v1/auth/admin/users/<user_id>/ — Permanently delete a user."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user == request.user:
        return Response({'error': 'You cannot delete your own account.'}, status=400)

    user.delete()
    return Response({'message': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def admin_toggle_user(request, user_id):
    """POST /api/v1/auth/admin/users/<user_id>/toggle/ — Toggle active/inactive."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user == request.user:
        return Response({'error': 'You cannot deactivate your own account.'}, status=400)

    user.is_active = not user.is_active
    user.save()
    status_str = 'activated' if user.is_active else 'deactivated'
    return Response({'message': f'User {status_str} successfully.', 'is_active': user.is_active})
