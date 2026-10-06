from rest_framework import serializers
from .models import Question, Tag, Vote
from users.serializers import UtilisateurSerializer
from answers.models import Reponse


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'nom', 'code_cim10', 'specialite', 'nb_utilisations']
        read_only_fields = ['nb_utilisations']


class QuestionSerializer(serializers.ModelSerializer):
    auteur = UtilisateurSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tags_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(),
        write_only=True, source='tags', required=False
    )
    nb_reponses = serializers.SerializerMethodField()
    mon_vote    = serializers.SerializerMethodField()
    score       = serializers.SerializerMethodField()
    fichier_url = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'titre', 'contenu', 'statut',
            'auteur', 'tags', 'tags_ids',
            'nb_vues', 'nb_reponses', 'mon_vote', 'score',
            'fichier', 'fichier_url',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['auteur', 'nb_vues', 'date_creation', 'date_modification']
        extra_kwargs = {'fichier': {'write_only': True, 'required': False}}

    def get_nb_reponses(self, obj):
        return obj.reponses.count()

    def get_mon_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(utilisateur=request.user).first()
            return vote.type_vote if vote else None
        return None

    def get_score(self, obj):
        positifs = obj.votes.filter(type_vote='positif').count()
        negatifs = obj.votes.filter(type_vote='negatif').count()
        return positifs - negatifs

    def get_fichier_url(self, obj):
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
            return obj.fichier.url
        return None

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        # auteur is injected by perform_create via serializer.save(auteur=...)
        question = Question.objects.create(**validated_data)
        question.tags.set(tags)
        return question


class VoteSerializer(serializers.ModelSerializer):
    question = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        required=False, allow_null=True
    )
    reponse = serializers.PrimaryKeyRelatedField(
        queryset=Reponse.objects.all(),
        required=False, allow_null=True
    )

    class Meta:
        model = Vote
        fields = ['id', 'type_vote', 'question', 'reponse', 'date_vote']
        read_only_fields = ['date_vote']

    def validate(self, data):
        if not data.get('question') and not data.get('reponse'):
            raise serializers.ValidationError("Vous devez voter sur une question ou une réponse.")
        if data.get('question') and data.get('reponse'):
            raise serializers.ValidationError("Vous ne pouvez pas voter sur les deux à la fois.")
        return data
