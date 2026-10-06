from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, F
from .models import Question, Tag, Vote
from .serializers import QuestionSerializer, TagSerializer, VoteSerializer
from answers.models import Reponse
from moderation.models import Badge
from notifications.models import Notification


class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Question.objects.all()
        statut  = self.request.query_params.get('statut')
        tag     = self.request.query_params.get('tag')
        search  = self.request.query_params.get('search')
        specialite = self.request.query_params.get('specialite')

        if statut:
            queryset = queryset.filter(statut=statut)
        if tag:
            queryset = queryset.filter(tags__nom__icontains=tag)
        if specialite:
            queryset = queryset.filter(tags__specialite__icontains=specialite)
        # Full-text search across titre + contenu + tags
        if search:
            queryset = queryset.filter(
                Q(titre__icontains=search) |
                Q(contenu__icontains=search) |
                Q(tags__nom__icontains=search) |
                Q(tags__specialite__icontains=search)
            )
        return queryset.distinct().order_by('-date_creation')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # F() is atomic — safe against race conditions and StrictMode double-calls
        Question.objects.filter(pk=instance.pk).update(nb_vues=F('nb_vues') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.auteur != request.user and not request.user.est_moderateur():
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.auteur != request.user and not request.user.est_moderateur():
            return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SimilarQuestionsView(APIView):
    """GET /api/questions/<id>/similar/ — returns up to 5 similar questions by shared tags"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            question = Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return Response([], status=200)

        tag_ids = question.tags.values_list('id', flat=True)
        similar = (
            Question.objects
            .filter(tags__id__in=tag_ids)
            .exclude(id=question.id)
            .distinct()
            .order_by('-date_creation')[:5]
        )
        serializer = QuestionSerializer(similar, many=True, context={'request': request})
        return Response(serializer.data)


class SuggestQuestionsView(APIView):
    """GET /api/questions/suggest/?q=... — live search suggestions while typing"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 3:
            return Response([])
        results = Question.objects.filter(
            Q(titre__icontains=q) | Q(tags__nom__icontains=q)
        ).distinct().order_by('-date_creation')[:6]
        data = [{'id': str(r.id), 'titre': r.titre, 'statut': r.statut} for r in results]
        return Response(data)


class AccepterReponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            question = Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return Response({"detail": "Question introuvable."}, status=404)

        if question.auteur != request.user:
            return Response({"detail": "Seul l'auteur peut accepter une réponse."}, status=403)

        reponse_id = request.data.get('reponse_id')
        try:
            reponse = Reponse.objects.get(id=reponse_id, question=question)
        except Reponse.DoesNotExist:
            return Response({"detail": "Réponse introuvable."}, status=404)

        Reponse.objects.filter(question=question).update(est_acceptee=False)
        reponse.est_acceptee = True
        reponse.save()
        question.statut = 'resolue'
        question.save()

        reponse.auteur.score_reputation += 15
        reponse.auteur.save()

        if reponse.auteur != request.user:
            Notification.objects.create(
                destinataire=reponse.auteur,
                question=question,
                reponse=reponse,
                message=f"Votre réponse a été acceptée sur : {question.titre}",
                type_notif='badge'
            )

        return Response({"detail": "Réponse acceptée."})


class FermerQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not request.user.est_moderateur():
            return Response({"detail": "Réservé aux modérateurs."}, status=403)
        try:
            question = Question.objects.get(pk=pk)
            question.statut = 'fermee'
            question.save()
            return Response({"detail": "Question fermée."})
        except Question.DoesNotExist:
            return Response({"detail": "Question introuvable."}, status=404)


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all().order_by('nom')
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]


class VoterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        type_vote  = request.data.get('type_vote')
        question_id = request.data.get('question')
        reponse_id  = request.data.get('reponse')

        # Validate type_vote
        if type_vote not in ('positif', 'negatif'):
            return Response({"detail": "type_vote invalide."}, status=400)

        # Resolve objects directly — bypasses serializer UUID parsing issues
        question = None
        reponse  = None
        if question_id:
            try:
                question = Question.objects.get(pk=question_id)
            except Exception:
                return Response({"detail": "Question introuvable."}, status=404)
        if reponse_id:
            try:
                from answers.models import Reponse as Rep
                reponse = Rep.objects.get(pk=reponse_id)
            except Exception:
                return Response({"detail": "Réponse introuvable."}, status=404)

        if not question and not reponse:
            return Response({"detail": "Fournir question ou reponse."}, status=400)

        filtre = {'utilisateur': request.user}
        if question: filtre['question'] = question
        if reponse:  filtre['reponse']  = reponse

        vote_existant = Vote.objects.filter(**filtre).first()

        if vote_existant:
            if vote_existant.type_vote == type_vote:
                self._ajuster_reputation(vote_existant, annuler=True)
                vote_existant.delete()
                return Response({"detail": "Vote annulé.", "action": "annule"})
            else:
                self._ajuster_reputation(vote_existant, annuler=True)
                vote_existant.type_vote = type_vote
                vote_existant.save()
                self._ajuster_reputation(vote_existant)
                return Response({"detail": "Vote inversé.", "action": "inverse"})
        else:
            vote = Vote.objects.create(utilisateur=request.user, type_vote=type_vote,
                                       question=question, reponse=reponse)
            self._ajuster_reputation(vote)
            # Send vote notification
            cible = question or reponse
            if cible and cible.auteur != request.user and type_vote == 'positif':
                Notification.objects.create(
                    destinataire=cible.auteur,
                    question=question if question else reponse.question,
                    reponse=reponse,
                    message=f"Quelqu'un a voté positivement votre {'question' if question else 'réponse'}.",
                    type_notif='vote'
                )
            return Response({"detail": "Vote enregistré.", "action": "vote"})

    def _ajuster_reputation(self, vote, annuler=False):
        cible = vote.question or vote.reponse
        auteur = cible.auteur
        delta = 0
        if vote.type_vote == 'positif':
            delta = -5 if annuler else +5
        elif vote.type_vote == 'negatif':
            delta = +2 if annuler else -2

        auteur.score_reputation += delta
        auteur.save()

        if vote.reponse:
            Reponse.objects.filter(pk=vote.reponse.pk).update(
                score=vote.reponse.votes.filter(type_vote='positif').count()
                     - vote.reponse.votes.filter(type_vote='negatif').count()
            )

        if delta > 0:
            self._verifier_badges(auteur)

    def _verifier_badges(self, utilisateur):
        from moderation.models import Badge, UtilisateurBadge
        # Find badges the user qualifies for but doesn't have yet
        badges_deja = UtilisateurBadge.objects.filter(utilisateur=utilisateur).values_list('badge_id', flat=True)
        badges = Badge.objects.filter(
            seuil_reputation__lte=utilisateur.score_reputation
        ).exclude(id__in=badges_deja)

        for badge in badges:
            UtilisateurBadge.objects.create(utilisateur=utilisateur, badge=badge)
            Notification.objects.create(
                destinataire=utilisateur,
                message=f"Félicitations ! Vous avez obtenu le badge : {badge.nom}",
                type_notif='badge'
            )
