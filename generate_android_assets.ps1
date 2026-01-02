$source = "public/logo-dark.png"
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
    
    # Round Icon (preserving original colors)
    $targetRound = Join-Path $folderPath "ic_launcher_round.png"
    $cx = [int]($size / 2)
    $cy = [int]($size / 2)
    magick $source -resize "${size}x${size}^" -gravity center -extent "${size}x${size}" `
           `( -size "${size}x${size}" xc:none -fill white -draw "circle $cx,$cy $cx,0" `) `
           -compose DstIn -composite $targetRound
    Write-Host "Generated round icon: $targetRound"

    # Adaptive Icon Foreground (Modern Android)
    $targetForeground = Join-Path $folderPath "ic_launcher_foreground.png"
    # Adaptive icons need a bit more padding/safe area buffer (66% of the 108dp icon is the safe zone)
    # We'll resize the logo to be roughly 80% of the icon size to ensure it fits well in the safe zone
    $foregroundSize = [int]($size * 0.8)
    magick $source -resize "${foregroundSize}x${foregroundSize}" -gravity center -background none -extent "${size}x${size}" $targetForeground
    Write-Host "Generated foreground icon: $targetForeground"
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
