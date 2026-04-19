$ErrorActionPreference = "Stop"

if (Test-Path "dist") {
  Remove-Item -LiteralPath "dist" -Recurse -Force
}

if (Test-Path "docs") {
  Remove-Item -LiteralPath "docs" -Recurse -Force
}

npx expo export --platform web

New-Item -ItemType Directory -Path "docs" -Force | Out-Null
Copy-Item -Path "dist\\*" -Destination "docs\\" -Recurse

$indexPath = "docs\\index.html"
$indexContent = Get-Content -Raw $indexPath
$indexContent = $indexContent.Replace('src="/_expo/', 'src="./_expo/')
Set-Content -Path $indexPath -Value $indexContent

$bundle = Get-ChildItem "docs\\_expo\\static\\js\\web\\AppEntry-*.js" | Select-Object -First 1
$bundleContent = Get-Content -Raw $bundle.FullName
$bundleContent = $bundleContent.Replace('httpServerLocation:"/assets/', 'httpServerLocation:"./assets/')
Set-Content -Path $bundle.FullName -Value $bundleContent

New-Item -ItemType File -Path "docs\\.nojekyll" -Force | Out-Null
