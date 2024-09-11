from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in, user_logged_out


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    user_profile = Profile.objects.get(user=user)
    user_profile.is_online = True
    user_profile.last_activity = timezone.now()
    user_profile.save()
    
@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    user_profile = Profile.objects.get(user=user)
    user_profile.is_online = False
    user_profile.save()