import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *
from chat.models import Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = f"room_{self.scope['url_route']['kwargs']['room_id']}"
        await self.channel_layer.group_add(
            self.room_name,     
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json
        event = {
            'type': 'send_message',
            'message': message
        }
        await self.channel_layer.group_send(self.room_name, event)

    async def send_message(self, event):
        data = event['message']
        if self.scope['user'].is_authenticated: 
            sender = data['sender']
            if sender == self.scope['user'].username:
                await self.create_message(data = data)
        img_url = await self.get_user_image_url(data["sender"])
        response_data = {
            'sender': data['sender'],
            'message': data['message'],
            'img_url': img_url
        }
        await self.send(text_data=json.dumps({'message': response_data}))


    @database_sync_to_async
    def create_message(self, data):
        try:
            get_room_by_id = Room.objects.get(pk=data['room_id'])
            new_message = Message(room=get_room_by_id, sender=data['sender'], message=data['message'])
            new_message.save()
        except Exception as e:
            print(f"Error occurred while creating message: {e}")

    @database_sync_to_async
    def get_user_image_url(self, username):
        try:
            user = User.objects.filter(username=username).first()
            img_url = user.profile.image.url
            return img_url
        except User.DoesNotExist:
            print(f"User not found!")

