from django.contrib import admin
from .models import Post, Comment, Reply, Notification
from .models import Friend, FriendRequest

admin.site.register(Friend)
admin.site.register(FriendRequest)

#Regist models
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Reply)
admin.site.register(Notification)
