
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("posts/<str:action>", views.posts, name="posts"),
    # path("posts/user/<int:id>", views.posts, name="posts"),
    path("post", views.create_post, name="post"),
    path("user/<int:id>", views.user_view, name="user_view"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("like/<str:action>/<int:id>", views.like_post, name="like"),
    path("register", views.register, name="register")
]