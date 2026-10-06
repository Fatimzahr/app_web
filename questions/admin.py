from django.contrib import admin
from .models import Question, Tag, Vote

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display  = ['titre', 'auteur', 'statut', 'nb_vues', 'date_creation']
    list_filter   = ['statut']
    search_fields = ['titre', 'contenu']
    list_editable = ['statut']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'code_cim10', 'specialite', 'nb_utilisations']
    search_fields = ['nom', 'code_cim10']

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'type_vote', 'date_vote']
    list_filter  = ['type_vote']
# Register your models here.
