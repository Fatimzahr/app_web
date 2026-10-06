from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Signalement, Badge, UtilisateurBadge
from .serializers import SignalementSerializer, BadgeSerializer, UtilisateurBadgeSerializer


class SignalementCreateView(generics.CreateAPIView):
    """
    POST /api/moderation/signalements/
    Signaler un contenu — correspond à signaler() du diagramme
    """
    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}


class SignalementListView(generics.ListAPIView):
    """
    GET /api/moderation/signalements/
    Voir tous les signalements — modérateur seulement
    """
    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.est_moderateur():
            return Signalement.objects.none()
        return Signalement.objects.filter(statut='en_attente')


class TraiterSignalementView(APIView):
    """
    POST /api/moderation/signalements/<id>/traiter/
    Traiter un signalement — correspond à traiter() du diagramme
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not request.user.est_moderateur():
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            signalement = Signalement.objects.get(pk=pk)
        except Signalement.DoesNotExist:
            return Response(
                {"detail": "Signalement introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        action   = request.data.get('action')   # 'traite' ou 'rejete'
        decision = request.data.get('decision', '')

        if action not in ['traite', 'rejete']:
            return Response(
                {"detail": "Action invalide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        signalement.statut     = action
        signalement.decision   = decision
        signalement.moderateur = request.user
        signalement.save()

        return Response({"detail": f"Signalement {action} avec succès."})


class BadgeListView(generics.ListAPIView):
    """
    GET /api/moderation/badges/
    Liste tous les badges disponibles
    """
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.AllowAny]


class MesBadgesView(generics.ListAPIView):
    """
    GET /api/moderation/mes-badges/
    Voir ses propres badges
    """
    serializer_class = UtilisateurBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UtilisateurBadge.objects.filter(
            utilisateur=self.request.user
        )
# Create your views here.
