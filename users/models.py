import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UtilisateurManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):

    ROLES = [
        ('patient', 'Patient'),
        ('etudiant', 'Étudiant en médecine'),
        ('medecin', 'Médecin / Professionnel'),
        ('moderateur', 'Modérateur'),
        ('admin', 'Administrateur'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email            = models.EmailField(unique=True)
    nom              = models.CharField(max_length=100)
    prenom           = models.CharField(max_length=100)
    role             = models.CharField(max_length=20, choices=ROLES, default='patient')
    score_reputation = models.IntegerField(default=0)
    date_inscription = models.DateTimeField(auto_now_add=True)
    est_verifie      = models.BooleanField(default=False)
    est_actif        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    avatar           = models.ImageField(upload_to='avatars/', null=True, blank=True)

    objects = UtilisateurManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    def est_medecin(self):
        return self.role in ['medecin', 'moderateur', 'admin']

    def est_moderateur(self):
        return self.role in ['moderateur', 'admin']


class ProfilProfessionnel(models.Model):

    STATUTS = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
    ]

    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur             = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='profil_pro')
    numero_inpe             = models.CharField(max_length=20, blank=True)
    specialite              = models.CharField(max_length=100)
    etablissement           = models.CharField(max_length=200)
    document_justificatif   = models.FileField(upload_to='documents/', null=True, blank=True)
    statut_verification     = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_soumission         = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Profil Professionnel'

    def __str__(self):
        return f"Profil pro de {self.utilisateur.email}"