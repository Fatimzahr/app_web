from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['destinataire', 'type_notif', 'est_lue', 'date_envoi']
    list_filter  = ['type_notif', 'est_lue']
    list_editable = ['est_lue']
# Register your models here.
