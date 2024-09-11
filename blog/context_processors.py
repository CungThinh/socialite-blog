from . models import FriendRequest

def friend_request_processor(request):
    if request.user.is_authenticated:
        friend_request = FriendRequest.objects.filter(receiver=request.user)
    else:
        friend_request = None
    return {'friend_request': friend_request}
    