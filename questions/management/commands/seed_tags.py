from django.core.management.base import BaseCommand
from questions.models import Tag

TAGS = [
    # Spécialités médicales
    {"nom": "Cardiologie",       "specialite": "Cardiologie",       "code_cim10": "I00-I99", "description": "Maladies du cœur et des vaisseaux"},
    {"nom": "Neurologie",        "specialite": "Neurologie",        "code_cim10": "G00-G99", "description": "Maladies du système nerveux"},
    {"nom": "Dermatologie",      "specialite": "Dermatologie",      "code_cim10": "L00-L99", "description": "Maladies de la peau"},
    {"nom": "Pneumologie",       "specialite": "Pneumologie",       "code_cim10": "J00-J99", "description": "Maladies respiratoires"},
    {"nom": "Gastroentérologie", "specialite": "Gastroentérologie", "code_cim10": "K00-K93", "description": "Maladies digestives"},
    {"nom": "Orthopédie",        "specialite": "Orthopédie",        "code_cim10": "M00-M99", "description": "Maladies ostéoarticulaires"},
    {"nom": "Pédiatrie",         "specialite": "Pédiatrie",         "code_cim10": "P00-P96", "description": "Médecine de l'enfant"},
    {"nom": "Gynécologie",       "specialite": "Gynécologie",       "code_cim10": "N80-N98", "description": "Santé féminine"},
    {"nom": "Endocrinologie",    "specialite": "Endocrinologie",    "code_cim10": "E00-E90", "description": "Maladies hormonales et métaboliques"},
    {"nom": "Ophtalmologie",     "specialite": "Ophtalmologie",     "code_cim10": "H00-H59", "description": "Maladies des yeux"},
    {"nom": "ORL",               "specialite": "ORL",               "code_cim10": "H60-H95", "description": "Oreille, nez, gorge"},
    {"nom": "Urologie",          "specialite": "Urologie",          "code_cim10": "N00-N39", "description": "Maladies urinaires"},
    {"nom": "Psychiatrie",       "specialite": "Psychiatrie",       "code_cim10": "F00-F99", "description": "Santé mentale"},
    {"nom": "Oncologie",         "specialite": "Oncologie",         "code_cim10": "C00-D48", "description": "Maladies cancéreuses"},
    {"nom": "Infectiologie",     "specialite": "Infectiologie",     "code_cim10": "A00-B99", "description": "Maladies infectieuses"},
    {"nom": "Rhumatologie",      "specialite": "Rhumatologie",      "code_cim10": "M05-M14", "description": "Maladies articulaires inflammatoires"},
    {"nom": "Néphrologie",       "specialite": "Néphrologie",       "code_cim10": "N00-N29", "description": "Maladies des reins"},
    {"nom": "Hématologie",       "specialite": "Hématologie",       "code_cim10": "D50-D89", "description": "Maladies du sang"},
    # Thèmes transversaux
    {"nom": "Urgences",          "specialite": "",                  "code_cim10": "",        "description": "Situations d'urgence médicale"},
    {"nom": "Médicaments",       "specialite": "",                  "code_cim10": "",        "description": "Pharmacologie et traitements"},
    {"nom": "Chirurgie",         "specialite": "Chirurgie",         "code_cim10": "",        "description": "Interventions chirurgicales"},
    {"nom": "Nutrition",         "specialite": "",                  "code_cim10": "E40-E68", "description": "Alimentation et diététique"},
    {"nom": "Prévention",        "specialite": "",                  "code_cim10": "",        "description": "Médecine préventive et dépistage"},
    {"nom": "Grossesse",         "specialite": "Obstétrique",       "code_cim10": "O00-O99", "description": "Suivi de grossesse et accouchement"},
    {"nom": "Diabète",           "specialite": "Endocrinologie",    "code_cim10": "E10-E14", "description": "Diabète de type 1 et 2"},
    {"nom": "Hypertension",      "specialite": "Cardiologie",       "code_cim10": "I10-I15", "description": "Hypertension artérielle"},
    {"nom": "COVID-19",          "specialite": "Infectiologie",     "code_cim10": "U07",     "description": "Coronavirus et séquelles"},
    {"nom": "Allergie",          "specialite": "Immunologie",       "code_cim10": "L20-L30", "description": "Allergies et réactions immunitaires"},
]

class Command(BaseCommand):
    help = 'Seed medical tags into the database'

    def handle(self, *args, **kwargs):
        created = 0
        for data in TAGS:
            _, was_created = Tag.objects.get_or_create(nom=data['nom'], defaults=data)
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(
            f'✅ {created} tag(s) créé(s), {len(TAGS) - created} déjà existant(s).'
        ))
