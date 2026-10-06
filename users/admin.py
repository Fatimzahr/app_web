from django.contrib import admin
from .models import Utilisateur, ProfilProfessionnel

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display  = ['email', 'nom', 'prenom', 'role', 'score_reputation', 'est_verifie', 'est_actif']
    list_filter   = ['role', 'est_verifie', 'est_actif']
    search_fields = ['email', 'nom', 'prenom']
    list_editable = ['role', 'est_verifie', 'est_actif']

@admin.register(ProfilProfessionnel)
class ProfilProfessionnelAdmin(admin.ModelAdmin):
    list_display  = ['utilisateur', 'specialite', 'statut_verification']
    list_filter   = ['statut_verification']
    list_editable = ['statut_verification']
# Register your models here.
