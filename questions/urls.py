from django.urls import path
from .views import (
    QuestionListCreateView, QuestionDetailView,
    AccepterReponseView, VoterView, TagListView,
    FermerQuestionView, SimilarQuestionsView, SuggestQuestionsView,
)

urlpatterns = [
    path('',                                QuestionListCreateView.as_view(), name='questions-list'),
    path('voter/',                          VoterView.as_view(),              name='voter'),
    path('tags/',                           TagListView.as_view(),            name='tags-list'),
    path('suggest/',                        SuggestQuestionsView.as_view(),   name='suggest-questions'),
    path('<uuid:pk>/',                      QuestionDetailView.as_view(),     name='question-detail'),
    path('<uuid:pk>/similar/',              SimilarQuestionsView.as_view(),   name='similar-questions'),
    path('<uuid:pk>/accepter-reponse/',     AccepterReponseView.as_view(),    name='accepter-reponse'),
    path('<uuid:pk>/fermer/',               FermerQuestionView.as_view(),     name='fermer-question'),
]
