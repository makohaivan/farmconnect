"""
FarmConnect - User Models

Three roles:
- farmer : lists and sells produce
- buyer  : browses and purchases produce
- admin  : manages the platform (assigned manually, never via registration)

Profiles are created automatically via post_save signals.
Admins do not get a profile — they use the Django admin panel.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    ROLE_FARMER = 'farmer'
    ROLE_BUYER  = 'buyer'
    ROLE_ADMIN  = 'admin'

    # Admin is intentionally excluded from REGISTRATION_ROLES
    # so it never appears on the registration form
    ROLE_CHOICES = [
        (ROLE_FARMER, 'Farmer'),
        (ROLE_BUYER,  'Buyer'),
        (ROLE_ADMIN,  'Admin'),
    ]

    # Roles available on the public registration form
    REGISTRATION_ROLES = [ROLE_FARMER, ROLE_BUYER]

    role  = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_BUYER,
    )
    email    = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table     = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) — {self.role}"

    def save(self, *args, **kwargs):
        if not self.username:
            base = self.email.split('@')[0]
            username = base
            counter  = 1
            while User.objects.filter(username=username).exclude(pk=self.pk).exists():
                username = f"{base}{counter}"
                counter += 1
            self.username = username
        # Admins are always staff so they can access Django admin
        if self.role == self.ROLE_ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)

    @property
    def is_farmer(self): return self.role == self.ROLE_FARMER
    @property
    def is_buyer(self):  return self.role == self.ROLE_BUYER
    @property
    def is_admin_role(self): return self.role == self.ROLE_ADMIN


class FarmerProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmerprofile')
    farm_name   = models.CharField(max_length=200, blank=True)
    location    = models.CharField(max_length=200, blank=True)
    phone       = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    avatar      = models.ImageField(upload_to='avatars/farmers/', null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'farmer_profiles'

    def __str__(self):
        return f"Farmer — {self.user.get_full_name()}"


class BuyerProfile(models.Model):
    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyerprofile')
    phone            = models.CharField(max_length=20, blank=True)
    delivery_address = models.TextField(blank=True)
    avatar           = models.ImageField(upload_to='avatars/buyers/', null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'buyer_profiles'

    def __str__(self):
        return f"Buyer — {self.user.get_full_name()}"


# ── Signals ───────────────────────────────────────────────────────────────────
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Auto-create a profile when a new user registers.
    Admins do not get a profile.
    """
    if created:
        if instance.role == User.ROLE_FARMER:
            FarmerProfile.objects.create(user=instance)
        elif instance.role == User.ROLE_BUYER:
            BuyerProfile.objects.create(user=instance)
        # Admin: no profile created
