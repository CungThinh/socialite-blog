from django.urls import path
from . import views

urlpatterns = [
    path('', views.PostListView.as_view(), name='blog-home'),
    path('post/create/', views.PostCreateView.as_view(), name='post-create'),
    path('post/update/<int:pk>/', views.PostUpdateView.as_view(), name="post-update"),
    path('post/delete/<int:pk>/', views.PostDeleteView.as_view(), name="post-delete"),
    path('post/<int:pk>', views.PostDetailView.as_view(), name='post-detail'),
    path('load-more-posts/', views.load_more_posts, name='load-more-posts'),
    path('about/', views.about, name='blog-about'),
    path('like-post/<int:pk>/', views.like_post, name= 'like-post'),
    path('post/add-comment/<int:post_id>/', views.add_comment, name= 'add-comment'),
    path('post/reply-comment/<int:comment_id>', views.reply_comment, name='reply-comment'),
    path('load-comments/<int:post_id>/', views.load_comments, name='load-more-comments'),
    path('search/', views.search, name='search_users'),
    path("add-friend/", views.add_friend, name="add-friend"),
    path("accept-friend-request/", views.accept_friend_request, name="accept-friend-request"),
    path("reject-friend-request/", views.reject_friend_request, name="reject-friend-request"),
    path("unfriend/", views.unfriend, name="unfriend"),
    path('check_friends_status/', views.check_friend_status, name='check_friends_status'),
    path('load-notifications/', views.get_user_notifications, name='load-notification'),
    path('update-notifications/', views.set_notification_is_read, name='update-notification'),
]

#Expect: <App>/<model>_<view type>.html
