@echo off
echo UML Diagram Generator
echo ---------------------
echo Converting PlantUML files to PNG...

REM Check if Java is installed
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Java is not installed or not in your PATH.
    echo Please install Java and try again.
    pause
    exit /b 1
)

REM Check if PlantUML JAR exists
if not exist plantuml-mit-1.2025.2.jar (
    echo Error: PlantUML JAR file not found.
    echo Please ensure plantuml-mit-1.2025.2.jar is in the current directory.
    pause
    exit /b 1
)

echo Checking for PUML files...
dir /b *.puml >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: No PUML files found in the current directory.
    pause
    exit /b 1
)

echo Found PUML files to process.
echo.

REM Process all .puml files in the current directory
for %%f in (*.puml) do (
    echo Processing: %%f
    java -jar plantuml-mit-1.2025.2.jar -verbose "%%f"
    if %ERRORLEVEL% EQU 0 (
        echo Successfully generated PNG for %%f
        echo.
    ) else (
        echo Failed to generate PNG for %%f
        echo Please check the PUML file for syntax errors.
        echo.
    )
)

echo.
echo All PlantUML files have been processed.
echo PNG files are saved in the same directory.
echo.

pause
