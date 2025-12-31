$source = "public/PP-Tio.jpg"
$baseDir = "android/app/src/main/res"

# Mipmap Icon Sizes
$icons = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $icons.Keys) {
    $size = $icons[$folder]
    $folderPath = Join-Path $baseDir $folder
    if (-not (Test-Path $folderPath)) { New-Item -ItemType Directory -Path $folderPath -Force }
    
    # Square Icon
    $target = Join-Path $folderPath "ic_launcher.png"
    magick $source -resize "${size}x${size}^" -gravity center -extent "${size}x${size}" $target
    Write-Host "Generated square icon: $target"
    
    # Round Icon
    $targetRound = Join-Path $folderPath "ic_launcher_round.png"
    magick $source -resize "${size}x${size}^" -gravity center -extent "${size}x${size}" `
           -format 'png' -write mpr:img -delete 0 `
           -size "${size}x${size}" xc:black -fill white -draw "circle $($size/2),$($size/2) $($size/2),0" `
           mpr:img -alpha off -compose CopyOpacity -composite $targetRound
    Write-Host "Generated round icon: $targetRound"
}

# Splash Screens (Portrait)
$splashes = @{
    "drawable-port-mdpi" = "200x320"
    "drawable-port-hdpi" = "320x480"
    "drawable-port-xhdpi" = "480x800"
    "drawable-port-xxhdpi" = "720x1280"
    "drawable-port-xxxhdpi" = "1280x1920"
}

foreach ($folder in $splashes.Keys) {
    $size = $splashes[$folder]
    $folderPath = Join-Path $baseDir $folder
    if (-not (Test-Path $folderPath)) { New-Item -ItemType Directory -Path $folderPath -Force }
    
    $target = Join-Path $folderPath "splash.png"
    # For splash, we might want to keep the photo centered on a background or just cover
    magick $source -resize "${size}^" -gravity center -extent "$size" $target
    Write-Host "Generated splash screen: $target"
}
