from . models import FriendRequest, Notification
from chat.models import Room, Message

def friend_request_processor(request):
    if request.user.is_authenticated:
        friend_request = FriendRequest.objects.filter(receiver=request.user)
    else:
        friend_request = None
    return {'friend_request': friend_request}
    
def unread_messages_processor(request):
    if request.user.is_authenticated:
        rooms = Room.objects.by_user(request.user)
        
        unread_count = Message.objects.filter(
            room__in = rooms,
            isRead = False
        ).exclude(sender=request.user.username).count()
        return {'unread_message_count': unread_count}
    return {'unread_message_count': 0}

def notification_processor(request):
    if request.user.is_authenticated:
        notifications = Notification.objects.filter(user=request.user, is_read=False).order_by('-timestamp')
        return {'notifications': notifications}
    else:
        return {'notifications': None}