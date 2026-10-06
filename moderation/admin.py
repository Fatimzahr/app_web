from django.contrib import admin
from .models import Signalement, Badge, UtilisateurBadge

@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display  = ['signaleur', 'motif', 'statut', 'date_signalement', 'moderateur']
    list_filter   = ['statut']
    list_editable = ['statut']
    search_fields = ['motif']

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'niveau', 'seuil_reputation']
    list_editable = ['seuil_reputation']

@admin.register(UtilisateurBadge)
class UtilisateurBadgeAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'badge', 'date_obtention']
# Register your models here.
