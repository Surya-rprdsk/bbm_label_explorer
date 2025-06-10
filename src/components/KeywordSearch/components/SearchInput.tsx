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
      maxLength: 50,
      autoComplete: "new-password"
    },
    sx: {
      mb: 0.1,
      fontSize: '0.7rem',
      '& input': {
        fontSize: '0.7rem',
        padding: '4px 8px',
        mt: 0.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      },
      '& label': {
        fontSize: '0.7rem'
      },
      transition: 'all 0.2s ease-in-out'
    }
  };
  const handleInputChange = (type: 'label' | 'search', value: string) => {
    const trimmedValue = value.slice(0, 50);
    type === 'label' ? onLabelInputChange(trimmedValue) : onSearchInputChange(trimmedValue);
    if (activeInput !== type) setActiveInput(type);
  };

  return (
    <Box
      sx={{
        border: '1.5px solid',
        borderColor: theme.palette.divider,
        borderRadius: 0,
        background: theme.palette.background.paper,
        p: 0.5,
        display: 'flex',
        width: '100%',
        maxWidth: 900
      }}
    >
      <Box
        component="form"
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: 'flex', gap: 1, width: '100%' }}
      >        <TextField
          {...commonTextFieldProps}
          label="Label Input"
          placeholder="<Id>_<pp><DescriptiveName>_<Ex>"
          value={labelInput}
          onChange={(e) => handleInputChange('label', e.target.value)}
          onFocus={() => setActiveInput('label')}
          onBlur={() => setActiveInput(null)}
          name="label-input-no-save"
          sx={{ ...commonTextFieldProps.sx, maxWidth: 200, p: 0.1 }}
        /><TextField
          {...commonTextFieldProps}
          label="Keywords or Names"
          placeholder="Search labels"
          value={search}
          onChange={(e) => handleInputChange('search', e.target.value)}
          onFocus={() => setActiveInput('search')}
          onBlur={() => setActiveInput(null)}
          name="search-input-no-save"
          sx={{
            ...commonTextFieldProps.sx,
            maxWidth: 300,
            p: 0.1,
            transition: 'all 0.2s ease-in-out',
            '& .MuiInputBase-root': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default SearchInput;
