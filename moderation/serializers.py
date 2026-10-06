from rest_framework import serializers
from .models import Signalement, Badge, UtilisateurBadge


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'nom', 'description', 'niveau', 'seuil_reputation', 'icone_url']


class UtilisateurBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UtilisateurBadge
        fields = ['badge', 'date_obtention']


class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = [
            'id', 'motif', 'statut', 'question',
            'reponse', 'date_signalement', 'decision'
        ]
        read_only_fields = ['statut', 'date_signalement', 'decision']

    def validate(self, data):
        if not data.get('question') and not data.get('reponse'):
            raise serializers.ValidationError("Vous devez signaler une question ou une réponse.")
        if data.get('question') and data.get('reponse'):
            raise serializers.ValidationError("Vous ne pouvez pas signaler les deux à la fois.")
        return data

    def create(self, validated_data):
        return Signalement.objects.create(
            signaleur=self.context['request'].user,
            **validated_data
        )