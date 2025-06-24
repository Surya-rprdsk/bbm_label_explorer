import * as React from "react";
import { TextField, Box } from "@mui/material";
import { useTheme } from '@mui/material/styles';

export interface SearchInputProps {
  labelInput: string;
  search: string;
  onLabelInputChange: (value: string) => void;
  onSearchInputChange: (value: string) => void;
  activeInput: 'label' | 'search' | null;
  setActiveInput: (input: 'label' | 'search' | null) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  labelInput,
  search,
  onLabelInputChange,
  onSearchInputChange,
  activeInput,
  setActiveInput
}) => {
  const theme = useTheme();
  const commonTextFieldProps = {
    variant: "outlined" as const,
    fullWidth: true,
    size: "small" as const,
    autoComplete: "off",
    inputProps: {
      autoComplete: "new-password"
    },
    sx: {
      mb: 0.1,
      fontSize: '0.7rem',
      '& input': {
        fontSize: '0.7rem',
        padding: '2px 6px',
        mt: 0.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      },
      '& label': {
        fontSize: '0.7rem',
        transform: 'translate(6px, 10px) scale(1)'
      },
      '& label.MuiInputLabel-shrink': {
        transform: 'translate(6px, -6px) scale(0.75)'
      },
      '& .MuiInputBase-root': {
        height: '28px'
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '1px'
      },
      transition: 'all 0.2s ease-in-out'
    }
  };

  const handleInputChange = (type: 'label' | 'search', value: string) => {
    // Apply max length constraints directly
    const maxLength = type === 'search' ? 100 : 50;
    const trimmedValue = value.slice(0, maxLength);

    // Update state based on input type
    if (type === 'label') {
      onLabelInputChange(trimmedValue);
    } else {
      onSearchInputChange(trimmedValue);
    }

    // Set active input if changed
    if (activeInput !== type) setActiveInput(type);
  };

  return (
    <Box
      sx={{
        border: '1.5px solid',
        borderColor: theme.palette.divider,
        borderRadius: 0,
        background: theme.palette.background.paper,
        p: 0.3,
        display: 'flex',
        width: '100%',
        mt: 0.5,
        flexShrink: 0,
        height: 'auto',
        maxHeight: '40px'
      }}
    >
      <Box
        component="form"
        className="form-container"
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        sx={{
          display: 'flex',
          gap: 0.5,
          width: '100%',
          flexWrap: { xs: 'nowrap', sm: 'nowrap' }
        }}
      >        <TextField
          {...commonTextFieldProps}
          label="Label Input"
          placeholder="<Id>_<pp><DescriptiveName>_<Ex>"
          value={labelInput}
          onChange={(e) => handleInputChange('label', e.target.value)}
          onFocus={() => setActiveInput('label')}
          // Don't clear the active input state for Label Input field when it loses focus
          // This allows error messages to remain visible when the user clicks outside
          name="label-input-no-save"
          inputProps={{
            ...commonTextFieldProps.inputProps,
            maxLength: 50
          }}
          sx={{
            ...commonTextFieldProps.sx,
            width: '45%',
            flexGrow: 1,
            flexShrink: 1,
            p: 0.1
          }}
        />        <TextField
          {...commonTextFieldProps}
          label="Keywords or Names"
          placeholder="Search labels"
          value={search}
          onChange={(e) => handleInputChange('search', e.target.value)}
          onFocus={() => setActiveInput('search')}
          onBlur={() => setActiveInput('search')} // Keep 'search' active even when unfocused
          name="search-input-no-save"
          inputProps={{
            ...commonTextFieldProps.inputProps,
            maxLength: 100
          }}
          sx={{
            ...commonTextFieldProps.sx,
            width: '55%',
            flexGrow: 2,
            flexShrink: 1,
            p: 0.1,
            '& .MuiInputBase-root': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              height: '28px'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default SearchInput;
