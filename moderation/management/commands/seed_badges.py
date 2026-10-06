from django.core.management.base import BaseCommand
from moderation.models import Badge

BADGES = [
    {"nom": "Débutant",      "niveau": "bronze",  "seuil_reputation": 0,    "description": "Bienvenue sur MedStack !",                        "icone_url": "🌱"},
    {"nom": "Contributeur",  "niveau": "bronze",  "seuil_reputation": 50,   "description": "50 points de réputation atteints.",               "icone_url": "✍️"},
    {"nom": "Actif",         "niveau": "argent",  "seuil_reputation": 150,  "description": "150 points — membre actif de la communauté.",     "icone_url": "⚡"},
    {"nom": "Expert",        "niveau": "or",      "seuil_reputation": 500,  "description": "500 points — expert reconnu.",                    "icone_url": "🏆"},
    {"nom": "Spécialiste",   "niveau": "platine", "seuil_reputation": 1000, "description": "1000 points — spécialiste de haut niveau.",       "icone_url": "🌟"},
    {"nom": "Légende",       "niveau": "platine", "seuil_reputation": 5000, "description": "5000 points — légende de MedStack.",              "icone_url": "👑"},
]

class Command(BaseCommand):
    help = 'Seed badges into the database'

    def handle(self, *args, **kwargs):
        created = 0
        for data in BADGES:
            _, was_created = Badge.objects.get_or_create(nom=data['nom'], defaults=data)
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(
            f'✅ {created} badge(s) créé(s), {len(BADGES) - created} déjà existant(s).'
        ))
