from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import Room, Message
from django.contrib.auth.models import User
from users.models import Profile
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q
from django.db.models import Max

@login_required
def CreateRoom(request, username):
    if username == request.user.username:
        messages.warning(request, "Bạn không thể tạo phòng với chính tên của bạn.")
        print(request, "Bạn không thể tạo phòng với chính tên của bạn.")
        return redirect('chat-room') 
    try:
        another_user = User.objects.get(username=username)
    except User.DoesNotExist:
        messages.warning(request, "Tên người dùng không tồn tại.")
        print("Tên người dùng không tồn tại.")
        return redirect('chat-room')

    try:
        room = Room.objects.filter(
        Q(first_person=request.user, second_person=another_user) |
        Q(first_person=another_user, second_person=request.user)
        ).first()
        return JsonResponse({'room_id': room.id})
    except Room.DoesNotExist:
        new_room = Room.objects.create(first_person=request.user, second_person=another_user)
        return redirect('chat-room')
            
@login_required
def MessageView(request, username=None):
    get_all_rooms = Room.objects.by_user(request.user).annotate(
        last_message_time = Max('message__timestamp')
    ).order_by('-last_message_time')
    
    context = {
        "user": request.user,
        "rooms": get_all_rooms,
    }
    
    if username: 
        another_user = User.objects.get(username=username)
        room = Room.objects.filter(
            Q(first_person=request.user, second_person=another_user) |
            Q(first_person=another_user, second_person=request.user)
            ).first()
        context['room_id'] = room.id
    
    return render(request, 'chat/messages.html', context)   



def GetChatMesssages(request, room_id):
    try:
        room = Room.objects.get(pk=room_id)
        messages = Message.objects.filter(room=room)
        messages_data = []
        for message in messages:
            sender = User.objects.filter(username= message.sender).first()           
            sender_img_url = sender.profile.image.url
            data = {'sender': message.sender, 'message': message.message, 'sender_img_url': sender_img_url, 'timestamp': message.timestamp}
            message.isRead = True
            message.save()
            messages_data.append(data)
        return JsonResponse({'messages': messages_data}, status=200)
    except Room.DoesNotExist:
        return JsonResponse({'error': 'Room not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

def get_img_url(request, username):
    try: 
        user = User.objects.get(username = username)
        return JsonResponse({'img_url': user.profile.image.url})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)