from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/',        views.register,          name='auth-register'),
    path('login/',           views.LoginView.as_view(),name='auth-login'),
    path('logout/',          views.logout,             name='auth-logout'),
    path('refresh/',         views.refresh_token,      name='auth-refresh'),
    path('me/',              views.me,                 name='auth-me'),
    path('me/update/',       views.update_profile,     name='auth-update-profile'),
    path('change-password/', views.change_password,    name='auth-change-password'),

    # Admin
    path('admin/stats/',                    views.admin_stats,        name='admin-stats'),
    path('admin/users/',                    views.admin_list_users,   name='admin-list-users'),
    path('admin/users/<int:user_id>/',      views.admin_get_user,     name='admin-get-user'),
    path('admin/users/<int:user_id>/update/',views.admin_update_user, name='admin-update-user'),
    path('admin/users/<int:user_id>/delete/',views.admin_delete_user, name='admin-delete-user'),
    path('admin/users/<int:user_id>/toggle/',views.admin_toggle_user, name='admin-toggle-user'),
]
