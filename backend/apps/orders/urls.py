from django.urls import path
from . import views

urlpatterns = [
    path('',                          views.place_order,         name='place-order'),
    path('buyer/',                    views.buyer_orders,        name='buyer-orders'),
    path('farmer/',                   views.farmer_orders,       name='farmer-orders'),
    path('<int:order_id>/',           views.order_detail,        name='order-detail'),
    path('<int:order_id>/status/',    views.update_order_status, name='update-order-status'),
    path('<int:order_id>/cancel/',    views.cancel_order,        name='cancel-order'),
]
