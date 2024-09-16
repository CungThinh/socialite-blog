from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from users.views import user_logout
from django.conf.urls.static import static
from django.conf import settings
from users.views import LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include("users.urls")),
    path('logout/', user_logout, name='logout'),
    path('', include("blog.urls")),
    path('chat/',  include("chat.urls")),
    path("login/", LoginView, name="login"),
    path('accounts/', include('allauth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

#Static: Dùng để lưu trữ các tệp tĩnh mà không thay đổi
#Media: Thường chứa các tệp động, các tệp được sinh ra trong môi trường vận hành web như: người dùng upload ảnh
#video ...
