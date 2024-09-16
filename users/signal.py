import requests
from django.db.models.signals import post_save
from django.core.files.base import ContentFile
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in, user_logged_out
from allauth.socialaccount.signals import social_account_added, social_account_updated
from urllib.parse import urlparse
from PIL import Image
from io import BytesIO



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
    
@receiver(social_account_added)
def github_account_added(request, sociallogin, **kwargs):
    user = sociallogin.user
    extra_data = sociallogin.account.extra_data
    
    github_email = extra_data.get('email', None)
    github_avatar_url = extra_data.get('avatar_url', None)
    
    user.email = github_email
    user.profile.image.url = github_avatar_url
    
    user.save()
    
@receiver(social_account_updated)
def github_account_updated(request, sociallogin, **kwargs):
    print("Signal updated activated!")

    user = sociallogin.user
    extra_data = sociallogin.account.extra_data

    github_email = extra_data.get('email', None)
    github_avatar_url = extra_data.get('avatar_url', None)

    if github_email:
        user.email = github_email
    if github_avatar_url and hasattr(user, 'profile'):
        response = requests.get(github_avatar_url)
        if response.status_code == 200:
            file_name = urlparse(github_avatar_url).path.split('/')[-1]
            if not file_name.endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_name += '.jpg' 
            user.profile.image.save(file_name, ContentFile(response.content), save=True)
        
        user.profile.save()

    user.save()
    
    