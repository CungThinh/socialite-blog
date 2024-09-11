from django.db import models
from django.contrib.auth.models import User
from PIL import Image
from django.utils import timezone


# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(default='default.jpg', upload_to='profile_pics')
    friends = models.ManyToManyField(User, blank=True, related_name="friends")
    is_online = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True)

    def __str__(self):
        return f'{self.user.username} Profile'

    # Resize image
    def save(self, *args, **kwagrs):
        super().save(*args, **kwagrs)
        img = Image.open(self.image.path)
        if img.height > 300 or img.width > 300:
            output_size = (300, 300)
            img.thumbnail(output_size)
            img.save(self.image.path)
