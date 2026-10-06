from django.contrib import admin
from .models import Reponse, Commentaire

@admin.register(Reponse)
class ReponseAdmin(admin.ModelAdmin):
    list_display  = ['auteur', 'question', 'est_acceptee', 'score', 'date_creation']
    list_filter   = ['est_acceptee']
    list_editable = ['est_acceptee']

@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ['auteur', 'contenu', 'date_creation']
# Register your models here.
