# BBM Label Explorer Presentation Content

## Slide 1: Title Slide
- Title: BBM Label Explorer
- Subtitle: AUTOSAR Label Validation Tool
- Date: June 24, 2025

## Slide 2: Introduction
- Purpose of the Application:
  - A specialized tool for validating AUTOSAR label naming conventions
  - Ensures labels follow specific formatting rules and contain valid components
  - Provides detailed feedback on label validity
  - Helps users create compliant labels for AUTOSAR systems

## Slide 3: Application Overview
- Key Features:
  - Label validation against AUTOSAR naming conventions
  - Keyword search functionality
  - Detailed error reporting
  - Component-by-component validation
  - User-friendly interface for quick validation
  - Cross-platform desktop application (Windows)

## Slide 4: Label Structure
- AUTOSAR Label Format: `<Id>[_<pp>][<DescriptiveName>][_Ex]`
  - Id: Identifier part (first segment)
  - pp: Physical Part (if present)
  - DescriptiveName: Descriptive part containing camelCase words
  - Ex: Extension part (if present)
- Example: `RB_tPressureControl_Ex`
  - Id: `RB`
  - pp: `t` (Physical)
  - DescriptiveName: `PressureControl` (camelCase)
  - Ex: `Ex` (Extension)

## Slide 5: Validation Process Overview
- High-Level Process Flow:
  - User inputs a label
  - System validates the label structure and components
  - Results are displayed in the UI
- Insert Image: Use `Label_Validation_Simplified_Flow.png`

## Slide 6: Validation Process - Part 1
- Initial Eligibility Check:
  - Contains only valid characters (alphanumeric plus underscores)
  - Has proper formatting with no more than 3 parts separated by underscores
  - Starts with an uppercase letter
- Label Parsing:
  - Regex pattern extraction of components
  - CamelCase word identification

## Slide 7: Validation Process - Part 2
- Component Validation:
  - ID Validation
  - PP (Physical Part) Validation
  - Descriptive Parts Validation
  - Extension Validation (if present)
  - Length Check (max 27 characters)
- Insert Image: Use `Label Validation Flow.png`

## Slide 8: Error Handling
- Error Priority System:
  1. No Label
  2. Abbreviation of <pp> not available
  3. Physical part <pp> is missing
  4. DescriptiveName part <dd> is missing
  5. Duplicate keywords used
  6. Abbreviation of <dd> not available
  7. DescriptiveName part <dd> is invalid
  8. Extension <Ex> not available
  9. Extension part <Ex> is invalid
  10. Label exceeds 27 characters
- Insert Image: Use `ResultTable_Error_Display.png`

## Slide 9: Result Display
- Result Table Component:
  - Shows validation messages with appropriate colors
  - Displays data rows in a paginated table
  - Provides detailed feedback on each component
- Insert Image: Use `ResultTable_Error_Flow.png`

## Slide 10: Environment Configuration
- Configuration System:
  - Environment-specific configuration (dev/prod)
  - YAML-based configuration files
  - Configuration synchronization between environments
  - Type-safe configuration in both frontend and backend
- Best Practices:
  - Don't store secrets in configuration files
  - Keep configuration DRY (Don't Repeat Yourself)
  - Use type-safe configuration
  - Provide sensible defaults

## Slide 11: Technical Architecture
- Frontend: 
  - TypeScript/React
  - Material UI components
  - Responsive design
- Backend: 
  - Rust with Tauri framework
  - Keyword database for validation
- Cross-platform: 
  - Windows desktop application
  - Lightweight and efficient

## Slide 12: Getting Started
- Installation:
  - MSI installer for Windows
  - System requirements
- Basic Usage:
  - Label validation mode
  - Keyword search mode
  - Reading validation results
- Advanced Features:
  - Dark/Light mode
  - Configuration options

## Slide 13: Documentation
- Available Documentation:
  - UML diagrams for process flows
  - How to view the diagrams
  - Label validation flow readme
  - Environment configuration guide
- Viewing Diagrams:
  - Online PlantUML Server
  - VS Code with PlantUML extension
  - Export to various formats

## Slide 14: Q&A
- Thank You
- Questions?
- Contact Information
