from django.urls import path
from .views import (
    NotificationListView,
    MarquerLueView,
    MarquerToutesLuesView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('<uuid:pk>/lue/', MarquerLueView.as_view(), name='notification-lue'),
    path('toutes-lues/', MarquerToutesLuesView.as_view(), name='toutes-lues'),
]