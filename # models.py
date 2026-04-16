class Denuncia(models.Model):
    tipo = models.CharField(max_length=100)
    descricao = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
