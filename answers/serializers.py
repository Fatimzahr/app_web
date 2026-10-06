from rest_framework import serializers
from .models import Reponse, Commentaire
from users.serializers import UtilisateurSerializer


class CommentaireSerializer(serializers.ModelSerializer):
    auteur = UtilisateurSerializer(read_only=True)

    class Meta:
        model = Commentaire
        fields = ['id', 'reponse', 'auteur', 'contenu', 'date_creation']
        read_only_fields = ['auteur', 'date_creation']

    def create(self, validated_data):
        return Commentaire.objects.create(**validated_data)


class ReponseSerializer(serializers.ModelSerializer):
    auteur   = UtilisateurSerializer(read_only=True)
    mon_vote = serializers.SerializerMethodField()
    nb_votes = serializers.SerializerMethodField()
    # commentaires are nested but loaded separately via SectionCommentaires
    # keep them here for completeness but they won't block creation
    commentaires = serializers.SerializerMethodField()

    class Meta:
        model = Reponse
        fields = [
            'id', 'question', 'auteur', 'contenu',
            'est_acceptee', 'score', 'mon_vote', 'nb_votes',
            'commentaires', 'date_creation', 'date_modification'
        ]
        read_only_fields = [
            'auteur', 'est_acceptee', 'score',
            'date_creation', 'date_modification'
        ]

    def get_mon_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(utilisateur=request.user).first()
            return vote.type_vote if vote else None
        return None

    def get_nb_votes(self, obj):
        return obj.votes.count()

    def get_commentaires(self, obj):
        # Return lightweight comment list
        return [
            {
                'id': str(c.id),
                'contenu': c.contenu,
                'date_creation': c.date_creation,
                'auteur': {
                    'id': str(c.auteur.id),
                    'prenom': c.auteur.prenom,
                    'nom': c.auteur.nom,
                    'est_verifie': c.auteur.est_verifie,
                }
            }
            for c in obj.commentaires.all()
        ]

    def create(self, validated_data):
        # auteur is passed in by perform_create in the view
        return Reponse.objects.create(**validated_data)
