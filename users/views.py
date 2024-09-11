from django.contrib.auth.models import User
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from .form import UserRegisterForm, UpdateUserForm, UpdateProfileForm
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from blog.models import Post
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect

@login_required
def profile(request):
    posts = Post.objects.filter(author=request.user)
    context = {
        'posts': posts
    }
    return render(request, 'users/profile.html', context)


@login_required
def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out')
    return redirect("register")


@login_required
def update_profile(request):
    if request.method == 'POST':
        u_form = UpdateUserForm(request.POST, instance=request.user)
        p_form = UpdateProfileForm(request.POST, request.FILES, instance=request.user.profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, f'Your profile has been updated')
            return redirect('profile')
    else:
        u_form = UpdateUserForm(instance=request.user)
        p_form = UpdateProfileForm(instance=request.user.profile)
    context = {
        'u_form': u_form,
        'p_form': p_form
    }
    return render(request, 'users/update_profile.html', context)


class UserPostListView(ListView):
    models = Post
    template_name = 'users/user_post.html'
    context_object_name = 'posts'
    paginate_by = 5

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs.get('username'))
        return Post.objects.filter(author=user).order_by('-date_posted')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = get_object_or_404(User, username=self.kwargs.get('username'))
        context['user'] = user
        return context

    def get(self, request, *args, **kwargs):
        if request.user.username == self.kwargs.get('username'):
            return redirect('profile')
        return super().get(request, *args, **kwargs)


def LoginView(request):
    if request.method == 'POST':
        username = request.POST.get('username')  # Lấy username từ form
        password = request.POST.get('password')

        try:
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                print('Log in successful with', user.username)
                messages.success(request, "You are Logged In")
                return redirect('blog-home')
            else:
                print("error")
                messages.error(request, 'Username or password does not exit.')
        
        except:
            print("Error")
            messages.error(request, 'User does not exist')

    return HttpResponseRedirect("/")

def RegisterView(request, *args, **kwargs):
    if request.user.is_authenticated:
        messages.warning(request, f"Hey {request.user.username}, you are already logged in")
        return redirect('blog-home')   

    form = UserRegisterForm(request.POST or None)
    if form.is_valid():
        form.save()
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password1')

        user = authenticate(username=username, password=password)
        login(request, user)

        messages.success(request, f"Hi {request.user.username}, your account have been created successfully.")
        return redirect('blog-home')
    
    context = {'form':form}
    return render(request, 'users/login.html', context)