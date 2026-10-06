import re
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Reponse, Commentaire
from .serializers import ReponseSerializer, CommentaireSerializer
from notifications.models import Notification
from users.models import Utilisateur


def detecter_mentions(contenu, auteur, question, reponse=None):
    """Detect @username mentions and create notifications"""
    mentions = re.findall(r'@(\w+)', contenu)
    for mention in set(mentions):
        try:
            destinataire = Utilisateur.objects.get(nom__iexact=mention)
            if destinataire != auteur:
                Notification.objects.create(
                    destinataire=destinataire,
                    question=question,
                    reponse=reponse,
                    message=f"{auteur.prenom} {auteur.nom} vous a mentionné dans une réponse.",
                    type_notif='mention'
                )
        except Utilisateur.DoesNotExist:
            pass


class ReponseListCreateView(generics.ListCreateAPIView):
    serializer_class = ReponseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Reponse.objects.all()
        question_id = self.request.query_params.get('question')
        if question_id:
            queryset = queryset.filter(question__id=question_id)
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        reponse = serializer.save(auteur=self.request.user)
        question = reponse.question

        # Notification to question author
        if question.auteur != self.request.user:
            Notification.objects.create(
                destinataire=question.auteur,
                question=question,
                reponse=reponse,
                message=f"Nouvelle réponse sur votre question : {question.titre}",
                type_notif='reponse'
            )

        # Detect @mentions in the answer
        detecter_mentions(reponse.contenu, self.request.user, question, reponse)


class ReponseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reponse.objects.all()
    serializer_class = ReponseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.auteur != request.user:
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.auteur != request.user and not request.user.est_moderateur():
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CommentaireListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentaireSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Commentaire.objects.all()
        reponse_id = self.request.query_params.get('reponse')
        if reponse_id:
            queryset = queryset.filter(reponse__id=reponse_id)
        return queryset

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        commentaire = serializer.save(auteur=self.request.user)
        # Detect @mentions in comments too
        if commentaire.reponse:
            detecter_mentions(
                commentaire.contenu, self.request.user,
                commentaire.reponse.question, commentaire.reponse
            )
