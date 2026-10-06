import uuid
from django.db import models
from users.models import Utilisateur


class Notification(models.Model):

    TYPES = [
        ('reponse', 'Nouvelle réponse'),
        ('vote', 'Vote reçu'),
        ('badge', 'Badge débloqué'),
        ('mention', 'Mention'),
        ('signalement', 'Signalement traité'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    destinataire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications')
    question     = models.ForeignKey('questions.Question', null=True, blank=True, on_delete=models.CASCADE)
    reponse      = models.ForeignKey('answers.Reponse', null=True, blank=True, on_delete=models.CASCADE)
    message      = models.TextField()
    type_notif   = models.CharField(max_length=20, choices=TYPES)
    est_lue      = models.BooleanField(default=False)
    date_envoi   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        ordering = ['-date_envoi']

    def __str__(self):
        return f"Notif pour {self.destinataire.email} — {self.type_notif}"
# Create your models here.
