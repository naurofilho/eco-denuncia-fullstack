from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image, ImageOps


def preparar_foto(arquivo):
    """Regrava a foto como JPEG, já girada na orientação certa e com tamanho limitado.

    A imagem é redesenhada do zero, então os metadados do arquivo original
    (EXIF: GPS, modelo do celular, data) não são guardados.
    """
    lado_max = settings.ECO_FOTO_LADO_MAX_PX
    arquivo.seek(0)
    with Image.open(arquivo) as original:
        imagem = ImageOps.exif_transpose(original).convert('RGB')
    imagem.thumbnail((lado_max, lado_max))
    saida = BytesIO()
    imagem.save(saida, format='JPEG', quality=82, optimize=True)
    return ContentFile(saida.getvalue(), name='foto.jpg')
