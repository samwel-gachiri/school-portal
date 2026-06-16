Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("G:\source\projects\schoolversion3_refined\school-website\portals\frontend\public\logo.png")

function Resize-Image($image, $size, $savePath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    
    # High quality interpolation
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill background with transparent
    $graph.Clear([System.Drawing.Color]::Transparent)
    
    # Calculate dimensions to maintain aspect ratio and center
    $ratio = [math]::Min($size / $image.Width, $size / $image.Height)
    # Give it a 10% padding so it looks good as a maskable icon
    $ratio = $ratio * 0.9
    $newWidth = [int]($image.Width * $ratio)
    $newHeight = [int]($image.Height * $ratio)
    $x = [int](($size - $newWidth) / 2)
    $y = [int](($size - $newHeight) / 2)
    
    $graph.DrawImage($image, $x, $y, $newWidth, $newHeight)
    
    $bmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graph.Dispose()
    $bmp.Dispose()
}

Resize-Image -image $img -size 192 -savePath "G:\source\projects\schoolversion3_refined\school-website\portals\frontend\public\pwa-192x192.png"
Resize-Image -image $img -size 512 -savePath "G:\source\projects\schoolversion3_refined\school-website\portals\frontend\public\pwa-512x512.png"

$img.Dispose()
