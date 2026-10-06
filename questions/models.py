import uuid
from django.db import models
from users.models import Utilisateur


class Tag(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom             = models.CharField(max_length=100, unique=True)
    code_cim10      = models.CharField(max_length=20, blank=True)
    description     = models.TextField(blank=True)
    specialite      = models.CharField(max_length=100, blank=True)
    nb_utilisations = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Tag'

    def __str__(self):
        return self.nom


class Question(models.Model):

    STATUTS = [
        ('ouverte', 'Ouverte'),
        ('resolue', 'Résolue'),
        ('fermee', 'Fermée'),
    ]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auteur              = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='questions')
    titre               = models.CharField(max_length=300)
    contenu             = models.TextField()
    statut              = models.CharField(max_length=20, choices=STATUTS, default='ouverte')
    tags                = models.ManyToManyField(Tag, blank=True, related_name='questions')
    reponse_acceptee    = models.OneToOneField('answers.Reponse', null=True, blank=True, on_delete=models.SET_NULL, related_name='acceptee_pour')
    date_creation       = models.DateTimeField(auto_now_add=True)
    date_modification   = models.DateTimeField(auto_now=True)
    nb_vues             = models.IntegerField(default=0)
    # Pièce jointe (image ou PDF)
    fichier             = models.FileField(upload_to='questions/fichiers/', null=True, blank=True)

    class Meta:
        verbose_name = 'Question'
        ordering = ['-date_creation']

    def __str__(self):
        return self.titre


class Vote(models.Model):

    TYPES = [
        ('positif', 'Positif'),
        ('negatif', 'Négatif'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur     = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='votes')
    question        = models.ForeignKey(Question, null=True, blank=True, on_delete=models.CASCADE, related_name='votes')
    reponse         = models.ForeignKey('answers.Reponse', null=True, blank=True, on_delete=models.CASCADE, related_name='votes')
    type_vote       = models.CharField(max_length=10, choices=TYPES)
    date_vote       = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            ('utilisateur', 'question'),
            ('utilisateur', 'reponse'),
        ]
        verbose_name = 'Vote'

    def __str__(self):
        return f"{self.utilisateur.email} → {self.type_vote}"
