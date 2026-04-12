"""
FarmConnect - Accounts Serializers
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, FarmerProfile, BuyerProfile


class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FarmerProfile
        fields = ['farm_name', 'location', 'phone', 'description', 'is_verified', 'avatar']


class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BuyerProfile
        fields = ['phone', 'delivery_address', 'avatar']


class UserSerializer(serializers.ModelSerializer):
    farmerprofile = FarmerProfileSerializer(read_only=True)
    buyerprofile  = BuyerProfileSerializer(read_only=True)
    full_name     = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'date_joined',
            'farmerprofile', 'buyerprofile',
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined', 'is_active']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.role == User.ROLE_FARMER:
            data.pop('buyerprofile', None)
        elif instance.role == User.ROLE_BUYER:
            data.pop('farmerprofile', None)
        else:
            # Admin — remove both profiles
            data.pop('farmerprofile', None)
            data.pop('buyerprofile', None)
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """
    Public registration — only farmer and buyer roles allowed.
    Admin role is intentionally excluded.
    """
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    farm_name        = serializers.CharField(required=False, allow_blank=True)
    location         = serializers.CharField(required=False, allow_blank=True)
    phone            = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = [
            'email', 'first_name', 'last_name', 'role',
            'password', 'confirm_password',
            'farm_name', 'location', 'phone',
        ]

    def validate_role(self, value):
        # Block admin registration via this endpoint
        if value not in User.REGISTRATION_ROLES:
            raise serializers.ValidationError(
                "Invalid role. Choose farmer or buyer."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})
        return data

    def create(self, validated_data):
        confirmed_password = validated_data.pop('confirm_password')
        farm_name = validated_data.pop('farm_name', '')
        location  = validated_data.pop('location', '')
        phone     = validated_data.pop('phone', '')
        password  = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == User.ROLE_FARMER and hasattr(user, 'farmerprofile'):
            p = user.farmerprofile
            p.farm_name = farm_name
            p.location  = location
            p.phone     = phone
            p.save()
        elif user.role == User.ROLE_BUYER and hasattr(user, 'buyerprofile'):
            p = user.buyerprofile
            p.phone = phone
            p.save()

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

    @classmethod
    def get_token(cls, user):
        token         = super().get_token(user)
        token['role'] = user.role
        token['email']= user.email
        token['name'] = user.get_full_name()
        return token


class UpdateProfileSerializer(serializers.ModelSerializer):
    farm_name        = serializers.CharField(required=False, allow_blank=True)
    location         = serializers.CharField(required=False, allow_blank=True)
    phone            = serializers.CharField(required=False, allow_blank=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'farm_name', 'location', 'phone', 'delivery_address']

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name  = validated_data.get('last_name',  instance.last_name)
        instance.save()

        if instance.role == User.ROLE_FARMER and hasattr(instance, 'farmerprofile'):
            p = instance.farmerprofile
            p.farm_name = validated_data.get('farm_name', p.farm_name)
            p.location  = validated_data.get('location',  p.location)
            p.phone     = validated_data.get('phone',     p.phone)
            p.save()
        elif instance.role == User.ROLE_BUYER and hasattr(instance, 'buyerprofile'):
            p = instance.buyerprofile
            p.phone            = validated_data.get('phone', p.phone)
            p.delivery_address = validated_data.get('delivery_address', p.delivery_address)
            p.save()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password     = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "New passwords do not match."})
        return data


# ── Admin-specific serializers ────────────────────────────────────────────────
class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user list in admin dashboard."""
    full_name    = serializers.SerializerMethodField()
    farm_name    = serializers.SerializerMethodField()
    profile_phone= serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'is_active', 'date_joined', 'farm_name', 'profile_phone'
        ]

    def get_full_name(self, obj):    return obj.get_full_name()
    def get_farm_name(self, obj):
        if obj.role == User.ROLE_FARMER and hasattr(obj, 'farmerprofile'):
            return obj.farmerprofile.farm_name
        return None
    def get_profile_phone(self, obj):
        if obj.role == User.ROLE_FARMER and hasattr(obj, 'farmerprofile'):
            return obj.farmerprofile.phone
        if obj.role == User.ROLE_BUYER and hasattr(obj, 'buyerprofile'):
            return obj.buyerprofile.phone
        return None


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Admin can change role and active status."""
    class Meta:
        model  = User
        fields = ['role', 'is_active', 'first_name', 'last_name']
