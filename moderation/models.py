import uuid
from django.db import models
from users.models import Utilisateur


class Badge(models.Model):

    NIVEAUX = [
        ('bronze', 'Bronze'),
        ('argent', 'Argent'),
        ('or', 'Or'),
        ('platine', 'Platine'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom              = models.CharField(max_length=100, unique=True)
    description      = models.TextField()
    niveau           = models.CharField(max_length=10, choices=NIVEAUX)
    seuil_reputation = models.IntegerField(default=0)
    icone_url        = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Badge'

    def __str__(self):
        return f"{self.nom} ({self.niveau})"


class UtilisateurBadge(models.Model):
    utilisateur    = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='badges')
    badge          = models.ForeignKey(Badge, on_delete=models.CASCADE)
    date_obtention = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('utilisateur', 'badge')
        verbose_name = 'Badge utilisateur'

    def __str__(self):
        return f"{self.utilisateur.email} → {self.badge.nom}"


class Signalement(models.Model):

    STATUTS = [
        ('en_attente', 'En attente'),
        ('traite', 'Traité'),
        ('rejete', 'Rejeté'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    signaleur        = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='signalements')
    moderateur       = models.ForeignKey(Utilisateur, null=True, blank=True, on_delete=models.SET_NULL, related_name='signalements_traites')
    question         = models.ForeignKey('questions.Question', null=True, blank=True, on_delete=models.CASCADE, related_name='signalements')
    reponse          = models.ForeignKey('answers.Reponse', null=True, blank=True, on_delete=models.CASCADE, related_name='signalements')
    motif            = models.CharField(max_length=255)
    statut           = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_signalement = models.DateTimeField(auto_now_add=True)
    decision         = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Signalement'
        ordering = ['-date_signalement']

    def __str__(self):
        return f"Signalement de {self.signaleur.email} — {self.statut}"
# Create your models here.
