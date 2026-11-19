from rest_framework.routers import SimpleRouter

from .views import DenunciaViewSet

router = SimpleRouter()
router.register('denuncias', DenunciaViewSet, basename='denuncia')

urlpatterns = router.urls
