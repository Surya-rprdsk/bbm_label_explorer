# Set environment variables to use local WixTools
$env:WIX_PATH="$PSScriptRoot\src-tauri\WixTools"
# $env:TAURI_SKIP_WIX_DOWNLOAD="true"

# Build the application
Write-Host "Building the application..." -ForegroundColor Cyan
cd "$PSScriptRoot"
npm run build

# Build the MSI installer
Write-Host "Building MSI installer..." -ForegroundColor Green
cd "$PSScriptRoot\src-tauri"
cargo build --release

# Get the application version from Cargo.toml
$cargoToml = Get-Content "$PSScriptRoot\src-tauri\Cargo.toml" -Raw
$versionMatch = [regex]::Match($cargoToml, 'version\s*=\s*"([^"]+)"')
$name = [regex]::Match($cargoToml, 'name\s*=\s*"([^"]+)"').Groups[1].Value
$version = $versionMatch.Groups[1].Value

Write-Host "Creating MSI for version $version..." -ForegroundColor Yellow

# Create the WIX XML file
$wixSrcDir = "$PSScriptRoot\src-tauri\target\wix"
if (-not (Test-Path $wixSrcDir)) {
    New-Item -ItemType Directory -Path $wixSrcDir -Force | Out-Null
}

# Run candle to compile the WXS file
Write-Host "Running WiX tools..." -ForegroundColor Magenta
$wxsFile = "$wixSrcDir\main.wxs"
$objFile = "$wixSrcDir\main.wixobj"
$msiFile = "$PSScriptRoot\src-tauri\target\release\$name-$version.msi"

# Make sure the target directory exists
if (-not (Test-Path "$PSScriptRoot\target")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\src-tauri\target\release" -Force | Out-Null
}

# Create the WXS file with application details
$wxsContent = @"
<?xml version='1.0' encoding='windows-1252'?>
<Wix xmlns='http://schemas.microsoft.com/wix/2006/wi'>
  <Product Name='BBM Label Explorer' Id='*' UpgradeCode='74FB4586-8340-4985-8E71-CDA7E337F4B5'
    Language='1033' Codepage='1252' Version='$version' Manufacturer='Bosch'>

    <Package Id='*' Keywords='Installer' Description="BBM Label Explorer Installer"
      Comments='BBM Label Explorer is a desktop application for exploring and validating BBM keywords'
      Manufacturer='Bosch' InstallerVersion='100' Languages='1033' Compressed='yes' SummaryCodepage='1252' />

    <Media Id='1' Cabinet='AiLabel.cab' EmbedCab='yes' DiskPrompt="CD-ROM #1" />
    <Property Id='DiskPrompt' Value="BBM Label Explorer Installation [1]" />

    <Directory Id='TARGETDIR' Name='SourceDir'>
      <Directory Id='ProgramFilesFolder' Name='PFiles'>        <Directory Id='INSTALLDIR' Name='BBMLabelExplorer'>
          <Component Id='MainExecutable' Guid='*'>            <File Id='AiLabelEXE' Name='bbm-label-explorer.exe' DiskId='1'
              Source='$PSScriptRoot\src-tauri\target\release\bbm-label-explorer.exe' KeyPath='yes'>
              <Shortcut Id="startmenuShortcut" Directory="ProgramMenuDir" Name="BBM Label Explorer"
                WorkingDirectory='INSTALLDIR' Advertise="yes" />
              <Shortcut Id="desktopShortcut" Directory="DesktopFolder" Name="BBM Label Explorer"
                WorkingDirectory='INSTALLDIR' Advertise="yes" />
            </File>
          </Component>
        </Directory>
      </Directory>      <Directory Id="ProgramMenuFolder" Name="Programs">
        <Directory Id="ProgramMenuDir" Name="BBM Label Explorer">
          <Component Id="ProgramMenuDir" Guid="*">
            <RemoveFolder Id='ProgramMenuDir' On='uninstall' />
            <RegistryValue Root='HKCU' Key='Software\[Manufacturer]\[ProductName]' Type='string' Value='' KeyPath='yes' />
          </Component>
        </Directory>
      </Directory>

      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>    <Feature Id='Complete' Level='1'>
      <ComponentRef Id='MainExecutable' />
      <ComponentRef Id='ProgramMenuDir' />
    </Feature>

    <UIRef Id="WixUI_InstallDir" />
    <Property Id="WIXUI_INSTALLDIR" Value="INSTALLDIR" />
  </Product>
</Wix>
"@

Set-Content -Path $wxsFile -Value $wxsContent

# Run candle to compile the WXS file
& "$env:WIX_PATH\candle.exe" -arch x64 -out $objFile $wxsFile

# Run light to create the MSI
& "$env:WIX_PATH\light.exe" -out $msiFile -ext WixUIExtension $objFile

if (Test-Path $msiFile) {
    Write-Host "MSI installer created successfully at: $msiFile" -ForegroundColor Green
} else {
    Write-Host "Failed to create MSI installer" -ForegroundColor Red
}