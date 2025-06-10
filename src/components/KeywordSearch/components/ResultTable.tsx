import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Pagination
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import { Keyword } from '../utils/validation';

// Constants moved from constants.ts
export const OUTPUT_HEADERS = [
  "abbrName", "longNameEn", "longNameDe", "domainName", "rbClassifications"
];
export const HEADER_LABELS: { [key: string]: string } = {
  "abbrName": "Keyword",
  "longNameEn": "English",
  "longNameDe": "German",
  "domainName": "Domain",
  "rbClassifications": "Category"
};

export interface ResultTableProps {
  data: Keyword[];
  labelData?: {
    rows: Keyword[];
    messages?: string[];
    message?: string;
    color?: string;
    consolidatedMessages?: Array<{ text: string; color: string }>;
  } | null;
  loading?: boolean;
  activeInput: 'label' | 'search' | null;
  searchQuery: string;
}

const ROWS_PER_PAGE = 5;

const ResultTable: React.FC<ResultTableProps> = ({
  data,
  labelData,
  loading = false,
  activeInput,
  searchQuery
}) => {
  const theme = useTheme();
  const dynamicHeaders = OUTPUT_HEADERS;
    // Keep track of last active input to maintain content visibility
  const lastActiveInputRef = React.useRef<'label' | 'search' | null>(activeInput);
  
  React.useEffect(() => {
    if (activeInput !== null) {
      lastActiveInputRef.current = activeInput;
    }
  }, [activeInput]);
  
  // Determine which rows to display based on active input
  const displayedRows = React.useMemo(() => {
    // Use current active input or fall back to last active input if null
    const effectiveInput = activeInput || lastActiveInputRef.current;
    
    if (effectiveInput === 'label' && labelData) {
      return labelData.rows.filter(Boolean);
    } else if (effectiveInput === 'search') {
      return data;
    }
    return [];
  }, [activeInput, data, labelData]);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const prevDisplayMode = React.useRef(activeInput);
  const prevRowsLength = React.useRef(displayedRows.length);
  
  // Reset pagination when switching between label and search
  React.useEffect(() => {
    if (prevDisplayMode.current !== activeInput) {
      setPage(1);
      prevDisplayMode.current = activeInput;
    }
  }, [activeInput]);

  // Reset pagination when data changes
  React.useEffect(() => {
    if (prevRowsLength.current !== displayedRows.length) {
      setPage(1);
      prevRowsLength.current = displayedRows.length;
    }
  }, [displayedRows.length]);

  // Calculate paginated rows
  const totalCount = displayedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));
  
  // Ensure page is within valid range
  const safePage = Math.max(1, Math.min(page, pageCount));
  
  // Get the current page of rows
  const paginatedRows = React.useMemo(() => {
    const start = (safePage - 1) * ROWS_PER_PAGE;
    return displayedRows.slice(start, start + ROWS_PER_PAGE);
  }, [displayedRows, safePage]);
  
  // Common table cell style for reuse
  const tableCellStyle = {
    fontSize: '0.7rem',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    padding: '2px 3px',
    border: '1px solid',
    borderColor: theme.palette.divider,
    color: theme.palette.text.primary
  };
  // Handle page change from pagination component
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    // Set page without affecting activeInput state
    setPage(value);
  };
  
  // Get display text for the current mode
  const getModeText = () => {
    // Use current active input or fall back to last active input if null
    const effectiveInput = activeInput || lastActiveInputRef.current;
    
    if (effectiveInput === 'search') {
      return 'Search Mode';
    } else if (effectiveInput === 'label') {
      return 'Label Mode';
    }
    return 'Select a Mode';
  };
  
  // Get empty state message based on active input
  const getEmptyMessage = () => {
    if (activeInput === 'search') {
      return searchQuery.trim() ? 'No name found' : 'Enter a name to begin';
    } else if (activeInput === 'label') {
      return 'Enter a label to begin';
    }
    return 'Enter a name to begin';
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Mode indicator */}
      {/* <Box sx={{ width: '100%', maxWidth: 900, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
          {getModeText()}
        </Typography>
      </Box> */}
        {/* Label data messages */}
      {activeInput === 'label' && labelData && labelData.messages && labelData.messages.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: 900, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {labelData.messages.map((msg, idx) => (
            <Typography 
              key={idx} 
              sx={{ 
                fontSize: '0.7rem', 
                color: labelData.color === 'red' ? 'red' : 
                       labelData.color === 'orange' ? 'orange' : 'navy', 
                fontWeight: 600, 
                textAlign: 'left', 
                mb: 0.5 
              }}
            >
              {msg}
            </Typography>
          ))}
        </Box>
      )}
        {/* Label status message */}
      {activeInput === 'label' && labelData && labelData.message && (
        <Box sx={{ width: '100%', maxWidth: 900, mb: 0.1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Typography
            data-testid="autosar-status-message"
            sx={{
              fontSize: '0.7rem',
              color: labelData.color === "red" ? "red" :
                     labelData.color === "orange" ? "orange" :
                     labelData.color === "navy" ? "#001f4d" : "inherit",
              fontWeight: 600,
              textAlign: 'left',
            }}
          >
            {labelData.message}
          </Typography>
        </Box>
      )}
      
      {/* Main content area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: 0, 
        width: '100%', 
        maxWidth: 900, 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {/* Loading indicator */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 1, width: '100%' }}>
            <CircularProgress size={16} />
          </Box>
        ) : (
          <React.Fragment>
            {/* Table Container */}
            <TableContainer 
              component={Paper} 
              elevation={0} 
              sx={{
                flex: 1,
                width: '100%',
                minWidth: 0,
                height: totalCount > ROWS_PER_PAGE ? 220 : '100%',
                minHeight: 0,
                overflowY: totalCount > ROWS_PER_PAGE ? 'auto' : 'hidden',
                borderRadius: 0,
                boxShadow: 'none',
                maxWidth: 900,
                background: theme.palette.background.paper,
              }}
            >
              <Table 
                stickyHeader 
                size="small" 
                sx={{ 
                  width: '100%', 
                  border: '1px solid', 
                  borderColor: theme.palette.divider, 
                  tableLayout: 'auto', 
                  borderRadius: 0, 
                  background: theme.palette.background.paper 
                }}
              >
                {/* Table Headers */}
                <TableHead>
                  <TableRow>
                    {dynamicHeaders.map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          minWidth: 60,
                          maxWidth: header === "abbrName" ? 90 : header === "rbClassifications" ? 120 : 180,
                          width: {
                            xs: header === "abbrName" ? '18vw' : header === "rbClassifications" ? '22vw' : '20vw',
                            sm: header === "abbrName" ? '12vw' : header === "rbClassifications" ? '16vw' : '18vw',
                            md: header === "abbrName" ? '80px' : header === "rbClassifications" ? '120px' : '160px',
                            lg: header === "abbrName" ? '70px' : header === "rbClassifications" ? '110px' : '150px',
                          },
                          fontWeight: 600,
                          backgroundColor: theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          fontSize: '0.7rem',
                          letterSpacing: 'normal',
                          textTransform: 'none',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          padding: '0.5px 1px',
                          boxShadow: 'none',
                        }}
                      >
                        {HEADER_LABELS[header] || header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                
                {/* Table Body */}
                <TableBody>
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell 
                        colSpan={dynamicHeaders.length} 
                        align="center" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          py: 0.5, 
                          border: '1px solid', 
                          borderColor: theme.palette.divider, 
                          color: theme.palette.text.secondary 
                        }}
                      >
                        <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {getEmptyMessage()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <TableRow
                        key={index}
                        className={String(row.lifeCycleState || '').toLowerCase() === 'valid' ? 'row-valid' : 'row-invalid'}
                        sx={{ fontSize: '0.7rem', background: theme.palette.background.paper }}
                      >
                        <TableCell sx={tableCellStyle}>{row.abbrName ?? '-'}</TableCell>
                        <TableCell sx={tableCellStyle}>{row.longNameEn ?? '-'}</TableCell>
                        <TableCell sx={tableCellStyle}>{row.longNameDe ?? '-'}</TableCell>
                        <TableCell sx={tableCellStyle}>{row.domainName ?? '-'}</TableCell>
                        <TableCell sx={tableCellStyle}>
                          {Array.isArray(row.rbClassifications) 
                            ? row.rbClassifications.join(", ") 
                            : (row.rbClassifications ?? '-')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination Controls */}
            {totalCount > ROWS_PER_PAGE && (
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                py: 0.1, 
                mt: 0.1 
              }}>
                <Pagination
                  count={pageCount}
                  page={safePage}
                  onChange={handlePageChange}
                  size="small"
                  siblingCount={1}
                  boundaryCount={0}
                  sx={{ 
                    '& .MuiPaginationItem-root': { 
                      fontSize: '0.7rem', 
                      minWidth: 24, 
                      height: 24 
                    } 
                  }}
                />
              </Box>
            )}
          </React.Fragment>
        )}
      </Box>
    </Box>
  );
};

export default ResultTable;