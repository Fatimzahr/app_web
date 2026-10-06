from django.urls import path
from .views import (
    InscriptionView, ProfilView, ProfilPublicView,
    SoumettreProfilProView, ValiderProfilProView,
    DeconnexionView, ListeUtilisateursView,
    ModifierRoleView, SuspendreUtilisateurView,
    RechercheUtilisateursView,
)

urlpatterns = [
    path('inscription/',                    InscriptionView.as_view(),          name='inscription'),
    path('profil/',                         ProfilView.as_view(),                name='profil'),
    path('profil-pro/',                     SoumettreProfilProView.as_view(),    name='profil-pro'),
    path('profil-pro/<uuid:pk>/valider/',   ValiderProfilProView.as_view(),      name='valider-profil-pro'),
    path('deconnexion/',                    DeconnexionView.as_view(),           name='deconnexion'),
    path('search/',                         RechercheUtilisateursView.as_view(), name='search-users'),
    path('',                                ListeUtilisateursView.as_view(),     name='liste-users'),
    path('<uuid:pk>/',                      ProfilPublicView.as_view(),          name='profil-public'),
    path('<uuid:pk>/role/',                 ModifierRoleView.as_view(),          name='modifier-role'),
    path('<uuid:pk>/suspendre/',            SuspendreUtilisateurView.as_view(),  name='suspendre-user'),
]