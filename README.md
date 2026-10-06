# MedStack 🏥

Plateforme collaborative de questions-réponses médicales — Stack Overflow pour la médecine.

## Technologies
- Backend : Django REST Framework
- Frontend : React
- Authentification : JWT

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/ton-username/medstack.git
cd medstack
```

### 2. Créer l'environnement virtuel
```bash
python -m venv env
env\Scripts\activate  # Windows
source env/bin/activate  # Mac/Linux
```

### 3. Installer les dépendances
```bash
pip install -r requirements.txt
```

### 4. Configurer le fichier .env
Crée un fichier `.env` à la racine :

### 5. Lancer le serveur
```bash
python manage.py migrate
python manage.py runserver
```

## Équipe
- Lafraoui khalil
- Fatemzahra Tafouit
- Ahda Youssef