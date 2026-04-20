from django.urls import path
from . import views

urlpatterns = [
    path('generate-description/', views.generate_description, name='ai-generate-desc'),
    path('price-suggest/',        views.price_suggestion,     name='ai-price-suggest'),
    path('chat/',                 views.chat,                 name='ai-chat'),
    path('insights/',             views.farmer_insights,      name='ai-insights'),
]
