from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.denuncias.views import DenunciaViewSet

router = DefaultRouter()
router.register(r'denuncias', DenunciaViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
