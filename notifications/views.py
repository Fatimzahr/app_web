from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Voir toutes ses notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            destinataire=self.request.user
        )


class MarquerLueView(APIView):
    """
    POST /api/notifications/<id>/lue/
    Marquer une notification comme lue
    — correspond à marquer_lue() du diagramme de classes
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(
                pk=pk,
                destinataire=request.user
            )
            notif.est_lue = True
            notif.save()
            return Response({"detail": "Notification marquée comme lue."})
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )


class MarquerToutesLuesView(APIView):
    """
    POST /api/notifications/toutes-lues/
    Marquer toutes les notifications comme lues
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            destinataire=request.user,
            est_lue=False
        ).update(est_lue=True)
        return Response({"detail": "Toutes les notifications marquées comme lues."})
# Create your views here.
