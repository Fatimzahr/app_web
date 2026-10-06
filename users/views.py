from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from .models import Utilisateur, ProfilProfessionnel
from .serializers import (
    UtilisateurSerializer,
    InscriptionSerializer,
    ProfilProfessionnelSerializer
)


class InscriptionView(generics.CreateAPIView):
    """
    POST /api/users/inscription/
    Permet à n'importe qui de créer un compte
    """
    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]


class ProfilView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/users/profil/       → voir son profil
    PUT  /api/users/profil/       → modifier son profil
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Retourne toujours l'utilisateur connecté
        return self.request.user


class ProfilPublicView(generics.RetrieveAPIView):
    """
    GET /api/users/<id>/
    Voir le profil public d'un autre utilisateur
    """
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.AllowAny]


class SoumettreProfilProView(generics.CreateAPIView):
    """
    POST /api/users/profil-pro/
    Soumettre une demande de vérification professionnelle
    """
    serializer_class = ProfilProfessionnelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class ValiderProfilProView(APIView):
    """
    POST /api/users/profil-pro/<id>/valider/
    Valider ou rejeter un profil pro — réservé modérateur/admin
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        # Vérifier que c'est un modérateur ou admin
        if not request.user.est_moderateur():
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            profil = ProfilProfessionnel.objects.get(pk=pk)
        except ProfilProfessionnel.DoesNotExist:
            return Response(
                {"detail": "Profil introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')  # 'valider' ou 'rejeter'

        if action == 'valider':
            profil.statut_verification = 'valide'
            profil.utilisateur.est_verifie = True
            profil.utilisateur.save()
            profil.save()
            return Response({"detail": "Profil validé avec succès."})

        elif action == 'rejeter':
            profil.statut_verification = 'rejete'
            profil.save()
            return Response({"detail": "Profil rejeté."})

        return Response(
            {"detail": "Action invalide. Utilisez 'valider' ou 'rejeter'."},
            status=status.HTTP_400_BAD_REQUEST
        )


class DeconnexionView(APIView):
    """
    POST /api/users/deconnexion/
    Invalide le refresh token (déconnexion)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Déconnexion réussie."})
        except Exception:
            return Response(
                {"detail": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class ListeUtilisateursView(generics.ListAPIView):
    """
    GET /api/users/
    Liste tous les utilisateurs — modérateur/admin seulement
    """
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.est_moderateur():
            return Utilisateur.objects.none()
        return Utilisateur.objects.all().order_by('-date_inscription')


class RechercheUtilisateursView(generics.ListAPIView):
    """
    GET /api/users/search/?q=... — public search for @mentions
    Returns nom, prenom, role for autocomplete
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 1:
            return Response([])
        users = Utilisateur.objects.filter(
            models.Q(nom__icontains=q) | models.Q(prenom__icontains=q)
        )[:8]
        data = [{'id': str(u.id), 'nom': u.nom, 'prenom': u.prenom, 'role': u.role, 'est_verifie': u.est_verifie} for u in users]
        return Response(data)


class ModifierRoleView(APIView):
    """
    PATCH /api/users/<id>/role/
    Modifier le rôle d'un utilisateur — admin seulement
    Correspond à gérer_utilisateurs() du diagramme
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response(
                {"detail": "Réservé à l'administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        nouveau_role = request.data.get('role')
        if nouveau_role not in ['patient', 'etudiant', 'medecin', 'moderateur', 'admin']:
            return Response({"detail": "Rôle invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.role = nouveau_role
        user.save()
        return Response({"detail": f"Rôle mis à jour : {nouveau_role}"})


class SuspendreUtilisateurView(APIView):
    """
    PATCH /api/users/<id>/suspendre/
    Suspendre ou réactiver un utilisateur — modérateur/admin
    Correspond à suspendre_utilisateur() du diagramme de séquence
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.est_moderateur():
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle actif/inactif
        user.est_actif = not user.est_actif
        user.save()
        etat = "réactivé" if user.est_actif else "suspendu"
        return Response({"detail": f"Utilisateur {etat}.", "est_actif": user.est_actif})
# Create your views here.
