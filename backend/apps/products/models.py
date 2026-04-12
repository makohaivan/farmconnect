"""
FarmConnect - Product Models
"""
from django.db import models
from apps.accounts.models import User


class Category(models.Model):
    name       = models.CharField(max_length=100, unique=True)
    slug       = models.SlugField(max_length=100, unique=True)
    icon       = models.CharField(max_length=10, default='📦')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'categories'
        verbose_name_plural = 'Categories'
        ordering  = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    UNIT_KG     = 'kg'
    UNIT_GRAM   = 'gram'
    UNIT_CRATE  = 'crate'
    UNIT_BAG    = 'bag'
    UNIT_LITRE  = 'litre'
    UNIT_BUNCH  = 'bunch'
    UNIT_PIECE  = 'piece'
    UNIT_DOZEN  = 'dozen'

    UNIT_CHOICES = [
        (UNIT_KG,    'Kilogram (kg)'),
        (UNIT_GRAM,  'Gram'),
        (UNIT_CRATE, 'Crate'),
        (UNIT_BAG,   'Bag'),
        (UNIT_LITRE, 'Litre'),
        (UNIT_BUNCH, 'Bunch'),
        (UNIT_PIECE, 'Piece'),
        (UNIT_DOZEN, 'Dozen'),
    ]

    farmer       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    category     = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name         = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    quantity     = models.PositiveIntegerField(default=0)
    unit         = models.CharField(max_length=10, choices=UNIT_CHOICES, default=UNIT_KG)
    image        = models.ImageField(upload_to='products/', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_featured  = models.BooleanField(default=False)
    views_count  = models.PositiveIntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.farmer.get_full_name()}"

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
