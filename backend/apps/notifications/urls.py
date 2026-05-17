from django.urls import path
from . import views

urlpatterns = [
    path('',                            views.list_notifications, name='notifications-list'),
    path('read-all/',                   views.mark_all_read,      name='notifications-read-all'),
    path('clear/',                      views.clear_all,          name='notifications-clear'),
    path('<int:notification_id>/read/', views.mark_read,          name='notifications-mark-read'),
]
