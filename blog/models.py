from django.db import models
from django.db.models import CharField
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse


FRIEND_REQUEST = (
    ("pending","Pending"),
    ("accept","Accept"),
    ("reject","Reject"),
)

# Create your models here.
class Post(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    date_posted = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    likes = models.ManyToManyField(User, blank=True, related_name='likes_user')
    
    class Meta:
        verbose_name_plural = "Post"
    
    def likes_count(self) -> int:
        return self.likes.count()

    def __str__(self) -> CharField:
        return self.title

    def get_absolute_url(self):
        return reverse('post-detail', kwargs={'pk': self.pk})
    
    def count_comments_and_replies(self):
        comments = self.comments.count()
        replies = sum(comment.replies.count() for comment in self.comments.all())
        
        return comments + replies
        

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    date_posted = models.DateTimeField(default=timezone.now)
    content = models.TextField()
    
    class Meta:
        verbose_name_plural = "Comment"
    
    def __str__(self):
        return f'{self.author.username} - {self.content}'
    
        
class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    date = models.DateTimeField(default=timezone.now)
    
    class Meta: 
        verbose_name_plural = "Bookmark"

class Reply(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    date_posted = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name_plural = "Reply"
        
class Friend(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user")
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend")
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}"
    
    class Meta:
        ordering = ["-date"]
        verbose_name_plural = "Friend"

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="request_sender")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="request_receiver")
    status = models.CharField(max_length=10, default="pending", choices=FRIEND_REQUEST)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}"
    
    class Meta:
        ordering = ["-date"]
        verbose_name_plural = "Friend Request"
        
class Notification(models.Model):
    LIKE = 'like'
    COMMENT = 'comment'
    REPLY = 'reply'
    
    NOTIFICATION_TYPES = [
        (LIKE, 'Like'),
        (COMMENT, 'Comment'),
        (REPLY, 'Reply'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender_notifications')
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name="noti_post")
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    timestamp = models.DateTimeField(default=timezone.now)
    
    def to_dict(self):
        return {
            'sender': self.sender.username,
            'notification_type': self.notification_type,
            'post_id': self.post.id,
            'is_read': self.is_read,
            'sender_image_url': self.sender.profile.image.url,
            'post_title': self.post.title,
        }
    
    
    