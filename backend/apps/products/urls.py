from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('categories/',                          views.category_list,          name='category-list'),
    path('',                                     views.product_list,           name='product-list'),
    path('<int:product_id>/',                    views.product_detail,         name='product-detail'),

    # Farmer CRUD
    path('my-listings/',                         views.farmer_products,        name='farmer-products'),
    path('my-listings/<int:product_id>/',        views.farmer_product_detail,  name='farmer-product-detail'),
    path('my-listings/<int:product_id>/toggle/', views.toggle_availability,    name='toggle-availability'),
]
