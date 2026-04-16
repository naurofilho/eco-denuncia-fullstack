from django.db import models
from django.contrib.auth.models import User

class Denuncia(models.Model):
    STATUS_CHOICES = [
        ('recebida', 'Recebida'),
        ('analise', 'Em análise'),
        ('resolvida', 'Resolvida'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=100)
    descricao = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='recebida')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.tipo
