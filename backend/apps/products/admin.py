from django.contrib import admin
from .models import Product, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ['name', 'farmer', 'category', 'price', 'quantity', 'unit', 'is_available']
    list_filter   = ['is_available', 'is_featured', 'category']
    search_fields = ['name', 'farmer__email', 'farmer__first_name']
