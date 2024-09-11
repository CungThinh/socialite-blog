from django.urls import path
from . import views

urlpatterns = [
    path('create-room/<str:username>', views.CreateRoom, name='create_room'),
    path('<str:username>/', views.MessageView, name='chat-room'),
    path('', views.MessageView, name='chat-room'),
    path('<int:room_id>/messages', views.GetChatMesssages , name = 'get_chatroom_messages')
]
