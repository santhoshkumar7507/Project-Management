from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView, UsersListView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/',    LoginView.as_view()),
    path('refresh/',  TokenRefreshView.as_view()),
    path('me/',       MeView.as_view()),
    path('users/',    UsersListView.as_view()),
]
