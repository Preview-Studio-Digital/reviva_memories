
[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
$src = 'G:\Meu Drive\02_BIBLIOTECAS\06_INTELIGÊNCIA ARTIFICIAL\22_REVIVA\IMAGENS\PAISAGENS'
$dst = 'c:\_DESENVOLVIMENTO\reviva_memories\assets\ambientes'
if (-not (Test-Path -LiteralPath $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

$list = @(
  @('CÉU.png', 'bg_ceu.jpg'),
  @('DESCAMPAGO.png', 'bg_descampado.jpg'),
  @('FLORESTA.png', 'bg_floresta.jpg'),
  @('GIRASSÓIS.png', 'bg_girassois.jpg'),
  @('LAGO.png', 'bg_lago.jpg'),
  @('MONTANHAS.png', 'bg_montanhas.jpg'),
  @('PALMEIRAS.png', 'bg_palmeiras.jpg'),
  @('VALE.png', 'bg_vale.jpg')
)

foreach ($item in $list) {
  $srcFile = Join-Path $src $item[0]
  $dstFile = Join-Path $dst $item[1]
  if (Test-Path -LiteralPath $srcFile) {
    $bmp = [System.Drawing.Bitmap]::FromFile($srcFile)
    $maxW = 1280.0
    $ratio = [Math]::Min(1.0, $maxW / $bmp.Width)
    $w = [int]($bmp.Width * $ratio)
    $h = [int]($bmp.Height * $ratio)
    $newBmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Dispose()
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
    $newBmp.Save($dstFile, $codec, $ep)
    $newBmp.Dispose()
    Write-Host ('Processado com sucesso: ' + $item[1])
  }
}
