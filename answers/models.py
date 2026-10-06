import uuid
from django.db import models
from users.models import Utilisateur


class Reponse(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question          = models.ForeignKey('questions.Question', on_delete=models.CASCADE, related_name='reponses')
    auteur            = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='reponses')
    contenu           = models.TextField()
    est_acceptee      = models.BooleanField(default=False)
    score             = models.IntegerField(default=0)
    date_creation     = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Réponse'
        ordering = ['-est_acceptee', '-score', '-date_creation']

    def __str__(self):
        return f"Réponse de {self.auteur.email} sur {self.question.titre[:30]}"


class Commentaire(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auteur        = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='commentaires')
    question      = models.ForeignKey('questions.Question', null=True, blank=True, on_delete=models.CASCADE, related_name='commentaires')
    reponse       = models.ForeignKey(Reponse, null=True, blank=True, on_delete=models.CASCADE, related_name='commentaires')
    contenu       = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Commentaire'
        ordering = ['date_creation']

    def __str__(self):
        return f"Commentaire de {self.auteur.email}"
# Create your models here.
