import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from blog.routing import websocket_urlpatterns as blog_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')

django_asgi_app = get_asgi_application()

# Hợp nhất tất cả các WebSocket routing từ các ứng dụng khác nhau
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat_websocket_urlpatterns + blog_websocket_urlpatterns  # Gộp route của cả blog và chat
        )
    ),
})