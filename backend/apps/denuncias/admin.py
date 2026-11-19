from django.contrib import admin
from django.utils.html import format_html

from .models import Denuncia, FotoDenuncia, HistoricoStatus


class FotoInline(admin.TabularInline):
    model = FotoDenuncia
    extra = 0
    fields = ['previa', 'imagem', 'created_at']
    readonly_fields = ['previa', 'created_at']

    @admin.display(description='prévia')
    def previa(self, foto):
        if not foto.imagem:
            return '-'
        return format_html('<img src="{}" style="max-height:90px;border-radius:6px">', foto.imagem.url)


class HistoricoInline(admin.TabularInline):
    model = HistoricoStatus
    extra = 0
    fields = ['status', 'nota', 'autor', 'data']
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Denuncia)
class DenunciaAdmin(admin.ModelAdmin):
    list_display = ['protocolo', 'tipo', 'status', 'endereco', 'anonima', 'created_at']
    list_filter = ['status', 'tipo', 'anonima', 'created_at']
    search_fields = ['protocolo', 'endereco', 'descricao']
    readonly_fields = ['protocolo', 'user', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    inlines = [FotoInline, HistoricoInline]

    def save_model(self, request, denuncia, form, change):
        super().save_model(request, denuncia, form, change)
        # Mudança de status pelo admin também entra na linha do tempo do cidadão.
        if change and 'status' in form.changed_data:
            HistoricoStatus.objects.create(
                denuncia=denuncia,
                status=denuncia.status,
                nota='Status alterado pela equipe.',
                autor=request.user,
            )
