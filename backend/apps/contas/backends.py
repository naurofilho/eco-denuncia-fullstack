from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q


class EmailOuUsuarioBackend(ModelBackend):
    """Autentica pelo e-mail ou pelo nome de usuário, sem diferenciar maiúsculas.

    O cadastro do site usa o e-mail como username; contas criadas com
    `createsuperuser` podem ter outro username, mas também entram pelo e-mail.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        Usuario = get_user_model()
        if username is None:
            username = kwargs.get(Usuario.USERNAME_FIELD)
        if not username or not password:
            return None

        candidatos = Usuario._default_manager.filter(
            Q(username__iexact=username) | Q(email__iexact=username)
        ).order_by('id')
        for usuario in candidatos:
            if usuario.check_password(password) and self.user_can_authenticate(usuario):
                return usuario

        if not candidatos:
            # Gasta o mesmo tempo de quando o usuário existe (dificulta descobrir e-mails cadastrados).
            Usuario().set_password(password)
        return None
