# Label Validation Process Flow Diagram

This document describes the label validation process flow in the AILabelAssist application as visualized in the PlantUML diagram `label_validation_flow.puml`.

## Overview

The AILabelAssist application performs validation on user-entered labels to ensure they follow specific naming conventions and contain valid component parts. The validation process is complex and involves multiple steps from parsing the label to displaying the validation results in the UI.

## How to View the Diagram

1. Install a PlantUML viewer plugin for your IDE (e.g., PlantUML Integration for VS Code)
2. Open the `label_validation_flow.puml` file
3. Use the plugin to render the diagram

Alternatively, you can use online PlantUML viewers:
- [PlantUML Online Server](https://www.plantuml.com/plantuml/uml/)
- [PlantText](https://www.planttext.com/)

## Validation Process Explained

The label validation process consists of several main phases:

### 1. Initial Label Eligibility Check

Before detailed validation, the system checks if the label meets basic requirements:
- Contains only valid characters (alphanumeric plus underscores)
- Has proper formatting with no more than 3 parts separated by underscores
- Starts with an uppercase letter

If these basic requirements are not met, validation stops and returns a "No Label" error.

### 2. Label Parsing

If the label passes initial eligibility, it's parsed using a regex pattern to extract its components:
- **id**: The identifier part (first segment before any underscore)
- **pp**: Physical Part (if present, the first letter of the second segment)
- **descriptivePart**: Descriptive part containing camelCase words
- **ex**: Extension part (if present, the third segment after the second underscore)

The system extracts camelCase components from the descriptive part using regex.

### 3. Component Validation

Each component is then validated:

#### ID Validation
- The ID is always added to the result rows without validation

#### PP (Physical Part) Validation
- Checked if it exists in the keywords database
- Verified that it has the "Physical" classification
- Appropriate errors are added if validation fails

#### Descriptive Parts Validation
- Checked that at least one descriptive part exists
- Each part is verified to exist in the keywords database
- Each part is checked to ensure it's not an Extension or Physical type
- Duplicate parts are detected and flagged
- Appropriate errors are added for each validation failure

#### Extension Validation (if present)
- Checked if it exists in the keywords database
- Verified that it has the "Extension" classification
- Appropriate errors are added if validation fails

#### Length Check
- The entire label is checked to ensure it doesn't exceed 27 characters

### 4. Validation Results Processing

After all validations:
- Unique errors are extracted and sorted by priority (defined in the ERROR_RANK array)
- The highest priority error becomes the primary message
- A consolidated messages array is created with all errors
- The validation results (rows, message, color, and consolidated messages) are returned

### 5. UI Display in ResultTable Component

The ResultTable component then:
- Determines whether to display search or label mode results
- Shows validation messages with appropriate colors
- Displays the data rows in a paginated table
- Shows pagination controls if there are more than 5 rows

## Error Priority

Errors are prioritized in this order (from highest to lowest):

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

## Data Flow

The diagram shows how data flows through the system:
1. User inputs a label string
2. System performs initial eligibility checks
3. If eligible, the system parses the label into components
4. Each component is validated against the keywords database
5. Validation results are processed and prioritized
6. ResultTable component displays the validation results

This comprehensive validation ensures that labels adhere to the required naming conventions and contain valid components.
