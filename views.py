from rest_framework import viewsets
from .models import Denuncia
from .serializers import DenunciaSerializer

class DenunciaViewSet(viewsets.ModelViewSet):
    queryset = Denuncia.objects.all()
    serializer_class = DenunciaSerializer
