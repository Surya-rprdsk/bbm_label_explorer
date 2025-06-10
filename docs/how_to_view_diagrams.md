# How to View the Label Validation Flowchart

This document explains how to open and view the PUML (PlantUML) diagrams that illustrate the label validation process in AILabelAssist.

## What are these diagrams?

The `.puml` files in this folder contain visual flowcharts that show how label validation works in AILabelAssist. These flowcharts can help you understand:

- How labels are validated
- What error messages mean
- How the validation process works step-by-step

## Option 1: View Online (Easiest)

1. Go to the [PlantUML Online Server](https://www.plantuml.com/plantuml/uml/tmpl/EAAMA100)
2. Open the `.puml` file in a text editor (like Notepad)
3. Copy all the text from the file
4. Paste it into the PlantUML Online Server
5. Click "Submit" to generate the diagram

## Option 2: View in VS Code (Recommended)

1. Install the "PlantUML" extension in VS Code:
   - Click on the Extensions icon in the sidebar (or press Ctrl+Shift+X)
   - Search for "PlantUML"
   - Install the extension by jebbs (usually the first result)

2. Open the `.puml` file in VS Code

3. To preview the diagram:
   - Option A: Right-click in the editor and select "Preview Current Diagram"
   - Option B: Use the Alt+D shortcut
   - Option C: Click the "Preview" button in the top-right corner of the editor

## Option 3: Export to Image

If you have VS Code with the PlantUML extension:

1. Open the `.puml` file
2. Right-click in the editor
3. Select "Export Current Diagram"
4. Choose your preferred format (PNG, SVG, PDF)
5. Select a location to save the image

## Which diagram should I look at?

- `label_validation_high_level.puml` - A simplified overview of the validation process (recommended for most users)
- `label_validation_flow.puml` - A detailed technical flowchart of the validation process
- `result_table_error_flow.puml` - Shows how errors appear in the results table
- `result_table_error_display.puml` - Shows the structure of error displays

## Troubleshooting

If diagrams don't render correctly:

1. Make sure you have a working internet connection (the PlantUML extension needs this)
2. Try restarting VS Code
3. Check if you have Java installed (required by some PlantUML renderers)
4. Try the online viewer instead
