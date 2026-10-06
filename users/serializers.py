from rest_framework import serializers
from .models import Utilisateur, ProfilProfessionnel


class ProfilProfessionnelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilProfessionnel
        fields = [
            'id', 'numero_inpe', 'specialite',
            'etablissement', 'statut_verification', 'date_soumission'
        ]
        # Le statut ne peut pas être modifié par l'utilisateur lui-même
        read_only_fields = ['statut_verification', 'date_soumission']


class UtilisateurSerializer(serializers.ModelSerializer):
    profil_pro = ProfilProfessionnelSerializer(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'email', 'nom', 'prenom', 'role',
            'score_reputation', 'date_inscription',
            'est_verifie', 'avatar', 'profil_pro'
        ]
        # Ces champs sont visibles mais non modifiables via l'API
        read_only_fields = ['score_reputation', 'date_inscription', 'est_verifie', 'role']


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = ['email', 'nom', 'prenom', 'role', 'password', 'password2']

    def validate(self, data):
        # Vérifier que les deux mots de passe sont identiques
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def validate_role(self, value):
        # Un utilisateur ne peut pas s'inscrire directement comme admin ou modérateur
        if value in ['admin', 'moderateur']:
            raise serializers.ValidationError("Ce rôle n'est pas autorisé à l'inscription.")
        return value

    def create(self, validated_data):
        # On retire password2 car on n'en a plus besoin
        validated_data.pop('password2')
        password = validated_data.pop('password')
        # On crée l'utilisateur avec le mot de passe hashé
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(password)
        utilisateur.save()
        return utilisateur