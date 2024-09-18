from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from .models import Post, Comment, Reply
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from .models import Friend, FriendRequest, Notification
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from elasticsearch_dsl.query import MultiMatch  
from .documents import PostDocument
from django.core.paginator import Paginator
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# Create your views here.

class PostListView(ListView):
    models = Post
    template_name = 'blog/home.html'
    context_object_name = 'posts'
    paginate_by = 5

    def get_queryset(self):
        q = self.request.GET.get('q')
        if q:
            query = MultiMatch(query=q, fields=["title", "content", "author_name"], fuzziness="AUTO")
            result = PostDocument.search().query(query).to_queryset()
            print(result)
            return result
        else: 
            return Post.objects.all().order_by('-date_posted')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_query'] = self.request.GET.get('q', '')
        return context
    
def load_more_posts(request):
    page = request.GET.get('page', 1)
    posts_list = Post.objects.all().order_by('-date_posted')
    paginator = Paginator(posts_list, 5)
    try: 
        posts = paginator.page(page)
    except:
        return JsonResponse({'posts': [], 'has_next': False})
        
    post_data = [{
        'id': post.id,
        'title': post.title,
        'content': post.content[:300],  # Lấy 300 ký tự đầu
        'author': post.author.username,
        'author_image': post.author.profile.image.url,
        'date_posted': post.date_posted.strftime('%Y-%m-%d'),
        'like_count': post.likes.count(),
        'comment_count': post.comments.count(),  # Đếm số comment
    } for post in posts]
    
    return JsonResponse({
        'posts': post_data,
        'has_next': posts.has_next(),
    })

def load_comments(request, post_id):
    post = Post.objects.get(id=post_id)
    comments = Comment.objects.filter(post=post).order_by('-date_posted')
    
    comments_data = [{
        'id': comment.id,
        'author': comment.author.username,
        'content': comment.content,
        'date_posted': comment.date_posted.strftime('%Y-%m-%d'),
        'profile_image_url': comment.author.profile.image.url,
        'replies': [{
            'id': reply.id,
            'author': reply.author.username,
            'content': reply.content,
            'date_posted': reply.date_posted.strftime('%Y-%m-%d'),
            'profile_image_url': reply.author.profile.image.url,
        } for reply in comment.replies.all()]
    } for comment in comments]
    
    return JsonResponse({'comments': comments_data})        

class PostDetailView(DetailView):
    models = Post

    def get_queryset(self):
        return Post.objects.filter(pk=self.kwargs['pk'])


class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    fields = ['title', 'content']

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


class PostUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Post
    fields = ['title', 'content']

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)

    def test_func(self):
        post = self.get_object()
        if self.request.user == post.author:
            return True
        return False


class PostDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    models = Post
    success_url = '/'

    def get_queryset(self):
        return Post.objects.filter(pk=self.kwargs['pk'])

    def test_func(self):
        post = self.get_object()
        if self.request.user == post.author:
            return True
        return False

@login_required
@require_POST
def like_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.user in post.likes.all():
        post.likes.remove(request.user)
        liked = False
    else:
        liked = True
        post.likes.add(request.user)
        
        # Like your own post
        if post.author != request.user: 
            notification = Notification(
                user = post.author,
                sender = request.user,
                notification_type = Notification.LIKE,
                post = post
            )
            
            notification.save()
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{post.author.id}', 
                {
                    'type': 'send_notification',
                    'notification': notification.to_dict()
                }
            )
        
    return JsonResponse({'likes_count': post.likes.count(), 'liked': liked})

@login_required
@require_POST
def add_comment(request, post_id):
    post = get_object_or_404(Post, pk=post_id)
    content = request.POST.get('content', '')
    if content:
        comment = Comment(
            content=content,
            author=request.user,
            post=post,
        )
        comment.save()
        return JsonResponse({
                'status': 'success',
                'author': comment.author.username,
                'avatar': comment.author.profile.image.url,
                'content': comment.content,
                'date_posted': comment.date_posted.strftime('%Y-%m-%d %H:%M:%S'),
        })
    else:
        return JsonResponse({'status': 'error', 'message': 'No content provided.'})

def about(request):
    return render(request, 'blog/about.html')

@login_required
@require_POST
def reply_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    content = request.POST.get('content', '')
    if content:
        reply = Reply(
            comment=comment,
            author=request.user,
            content=content
        )
        reply.save()
        return JsonResponse({
            'status': 'success',
            'author': reply.author.username,
            'avatar': reply.author.profile.image.url,
            'content': reply.content,
            'date_posted': reply.date_posted.strftime('%Y-%m-%d %H:%M:%S'),
        })
    else:
        return JsonResponse({'status': 'error', 'message': 'No content provided.'})
    
def search(request):
    query = request.GET.get('q')
    if query:
        users_data = []
        posts_data = []
        
        users = User.objects.filter(username__icontains=query) | User.objects.filter(email__icontains=query) 
        for user in users:
            user_data = {
                'username': user.username,
                'full_name': user.username,
                'email': user.email,
                'profile_image': user.profile.image.url,
            }
            
            users_data.append(user_data)
            
        post_query = MultiMatch(query=query, fields=["title"], fuzziness="AUTO")
        posts = PostDocument.search().query(post_query).to_queryset()
        for post in posts:
            post_data = {
                'title': post.title,
                'url': post.get_absolute_url()
            }
            posts_data.append(post_data)
        
    
    else:
        user_data = []
        posts_data = []


    return JsonResponse({'users': users_data, 'posts': posts_data}) 

@csrf_exempt
def add_friend(request):
    sender = request.user
    receiver_id = request.GET['id'] 
    bool = False

    if sender.id == int(receiver_id):
        return JsonResponse({'error': 'You cannot send a friend request to yourself.'})
    
    receiver = User.objects.get(id=receiver_id)
    
    
    try:
        friend_request = FriendRequest.objects.get(sender=sender, receiver=receiver)
        if friend_request:
            friend_request.delete()
        bool = False
        return JsonResponse({'error': 'Cancelled', 'bool':bool})
    except FriendRequest.DoesNotExist:
        friend_request = FriendRequest(sender=sender, receiver=receiver)
        friend_request.save()
        bool = True
        
        return JsonResponse({'success': 'Sent',  'bool':bool})
    
@csrf_exempt
def accept_friend_request(request):
    id = request.GET['id']
    sender =  User.objects.get(id=id)
    receiver = request.user
    
    friend_request = FriendRequest.objects.filter(sender=sender, receiver=receiver).first()
    
    if friend_request:
        sender.profile.friends.add(receiver)
        receiver.profile.friends.add(sender)
        friend_request.delete()
    
        data = {
            "message":"Accepted",
            "bool":True,
        }
    else:
        data = {
            "message":"An error occured",
            "bool":False,
        }
    
    return JsonResponse({'data': data})
        
@csrf_exempt
def reject_friend_request(request):
    id = request.GET['id']
    sender =  User.objects.get(id=id)
    receiver = request.user
    
    friend_request = FriendRequest.objects.filter(sender=sender, receiver=receiver).first()
    
    if friend_request:
        friend_request.delete()
    
        data = {
            "message":"Rejected",
            "bool":True,
        }
    else:
        data = {
            "message":"An error occured",
            "bool":False,
        }
    
    return JsonResponse({'data': data})

@csrf_exempt
def unfriend(request):
    sender = request.user
    friend_id = request.GET['id'] 
    bool = False
    
    if sender.id == friend_id:
        return JsonResponse({'error': 'You cannot unfriend yourself, wait a minute how did you even send yourself a friend request?.'})
    
    my_friend = User.objects.get(id=friend_id)
    
    if my_friend in sender.profile.friends.all():
        sender.profile.friends.remove(my_friend)
        my_friend.profile.friends.remove(sender)
        bool = True
        return JsonResponse({'success': 'Unfriend Successfull',  'bool':bool})
    

def check_friend_status(request):
    friends_status = []
    if request.user.profile.friends.all():
        for friend in request.user.profile.friends.all():
            friends_status.append({
                'id': friend.id,
                'is_online': friend.profile.is_online
            })

    return JsonResponse({'friends': friends_status})

def get_user_notifications(request):
    if request.user.is_authenticated:
        notifications = Notification.objects.filter(user=request.user).order_by('is_read', '-timestamp').all()
        return JsonResponse({'notifications': [n.to_dict() for n in notifications]})
    
def set_notification_is_read(request):
    if request.user.is_authenticated:
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'error'}, status=403)