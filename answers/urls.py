from django.urls import path
from .views import (
    ReponseListCreateView,
    ReponseDetailView,
    CommentaireListCreateView,
)

urlpatterns = [
    path('', ReponseListCreateView.as_view(), name='reponses-list'),
    path('<uuid:pk>/', ReponseDetailView.as_view(), name='reponse-detail'),
    path('commentaires/', CommentaireListCreateView.as_view(), name='commentaires-list'),
]