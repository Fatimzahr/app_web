from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'message', 'type_notif',
            'est_lue', 'date_envoi', 'question', 'reponse'
        ]
        read_only_fields = [
            'message', 'type_notif', 'date_envoi',
            'question', 'reponse'
        ]