from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='fichier',
            field=models.FileField(blank=True, null=True, upload_to='questions/fichiers/'),
        ),
    ]
