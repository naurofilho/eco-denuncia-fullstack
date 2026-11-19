from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = 'EcoDenúncia: administração'
admin.site.site_title = 'EcoDenúncia'
admin.site.index_title = 'Painel administrativo'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.contas.urls')),
    path('api/', include('apps.denuncias.urls')),
]

# Em desenvolvimento o próprio Django serve as fotos enviadas.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
