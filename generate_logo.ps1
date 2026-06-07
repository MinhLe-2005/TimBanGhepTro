Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$brush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 244, 63, 94))
$g.FillEllipse($brush1, 162, 262, 500, 500)

$brush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 0, 78, 112))
$g.FillEllipse($brush2, 362, 262, 500, 500)

$bmp.Save("C:\Users\Le Quang Minh\Downloads\roomiematch_logo_trong_suot.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
