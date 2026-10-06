from django.urls import path
from .views import (
    SignalementCreateView,
    SignalementListView,
    TraiterSignalementView,
    BadgeListView,
    MesBadgesView,
)

urlpatterns = [
    path('signalements/', SignalementListView.as_view(), name='signalements-list'),
    path('signalements/creer/', SignalementCreateView.as_view(), name='signalement-creer'),
    path('signalements/<uuid:pk>/traiter/', TraiterSignalementView.as_view(), name='traiter-signalement'),
    path('badges/', BadgeListView.as_view(), name='badges-list'),
    path('mes-badges/', MesBadgesView.as_view(), name='mes-badges'),
]