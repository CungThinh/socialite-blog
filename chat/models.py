from django.db import models
from django.utils import timezone
from users.models import User
from django.db.models import Q

class RoomManager(models.Manager):
    def by_user(self, user):
        lookup = Q(first_person=user) | Q(second_person=user)
        qs = self.get_queryset().filter(lookup).distinct()
        return qs


class Room(models.Model):
    first_person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_user1', null=True)
    second_person = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_user2', null=True)
    updated = models.DateTimeField(auto_now=True)
    objects = RoomManager()
    
    def get_latest_message(self):
        latest_message = self.message_set.order_by('-timestamp').first()
        
        if latest_message:
            return latest_message.message
        return "Not yet"


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    sender = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    isRead = models.BooleanField(default=False)