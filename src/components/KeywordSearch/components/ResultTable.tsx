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
  Pagination,
  Tooltip
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
  activeInput: 'label' | 'search' | null;
  searchQuery: string;
}

// Base number of rows for smallest window height
const MIN_ROWS_PER_PAGE = 6;
// Row height in pixels for calculations
const ROW_HEIGHT_PX = 18;

const ResultTable: React.FC<ResultTableProps> = ({
  data,
  labelData,
  activeInput,
  searchQuery
}) => {
  const theme = useTheme();
  const dynamicHeaders = OUTPUT_HEADERS;
  // Keep track of last active input to maintain content visibility
  const lastActiveInputRef = React.useRef<'label' | 'search' | null>(activeInput);

  // State to track window size and calculate rows per page
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);
  const [rowsPerPage, setRowsPerPage] = React.useState(MIN_ROWS_PER_PAGE);

  // Update rows per page based on window height
  React.useEffect(() => {
    const calculateRowsPerPage = () => {
      // Fixed heights (in pixels) for various UI elements
      const headerHeight = 38; // App header
      const searchInputHeight = 50; // Search input area
      const tableHeaderHeight = 20; // Table header row
      const paginationHeight = 20; // Pagination controls
      const otherUIHeight = 30; // Margins, padding, and safety buffer

      // Calculate available height for table content
      const availableHeight = window.innerHeight -
        (headerHeight + searchInputHeight + tableHeaderHeight + paginationHeight + otherUIHeight);

      // Calculate how many rows can fit (minimum 5)
      const calculatedRows = Math.max(
        MIN_ROWS_PER_PAGE,
        Math.floor(availableHeight / ROW_HEIGHT_PX)
      );

      // Limit maximum rows to a reasonable number (25) to prevent performance issues
      return Math.min(calculatedRows, 25);
    };

    // Handle window resize
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setRowsPerPage(calculateRowsPerPage());

      // Update CSS variables for responsive design
      document.documentElement.style.setProperty('--window-height', `${window.innerHeight}px`);
      document.documentElement.style.setProperty('--table-max-height', 'none');
      document.documentElement.style.setProperty('--table-row-height', `${ROW_HEIGHT_PX}px`);
      document.documentElement.style.setProperty('--table-min-rows', `${MIN_ROWS_PER_PAGE}`);

      // Explicitly disable scrollbars
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };

    // Set initial value and add resize listener
    handleResize();
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      // Reset overflow when component unmounts
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

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
  const pageCount = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  // Ensure page is within valid range
  const safePage = Math.max(1, Math.min(page, pageCount));

  // Get the current page of rows
  const paginatedRows = React.useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return displayedRows.slice(start, start + rowsPerPage);
  }, [displayedRows, safePage, rowsPerPage]);
  // Reusable styles for table elements
  const tableCellStyle = {
    fontFamily: 'var(--font-primary)',
    fontSize: '0.7rem',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    padding: '1px 2px',
    height: '16px',
    maxHeight: '16px',
    lineHeight: '14px',
    border: '1px solid',
    borderColor: theme.palette.divider,
    color: theme.palette.text.primary,
    transition: 'all 0.15s ease',
    '&:hover': {
      color: theme.palette.primary.main,
      fontWeight: 600
    }
  };
  const tableHeaderCellStyle = {
    fontFamily: 'var(--font-primary)',
    minWidth: 60,
    height: '20px',
    maxHeight: '20px',
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
    lineHeight: '14px',
    boxShadow: 'none',
    pl: 0.7
  };

  const tableRowHoverStyle = {
    transition: 'all 0.15s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(25, 118, 210, 0.15)',
      boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
      '& .MuiTableCell-root': {
        color: theme.palette.primary.main,
        fontWeight: 600
      }
    }
  };

  // Column width configuration
  const getColumnWidth = (header: string) => {
    const widths: Record<string, { maxWidth: number, widthPercent: string }> = {
      abbrName: { maxWidth: 90, widthPercent: '15%' },
      longNameEn: { maxWidth: 160, widthPercent: '20%' },
      longNameDe: { maxWidth: 160, widthPercent: '20%' },
      domainName: { maxWidth: 120, widthPercent: '25%' },
      rbClassifications: { maxWidth: 120, widthPercent: '20%' }
    };

    return {
      maxWidth: widths[header]?.maxWidth || 100,
      width: widths[header]?.widthPercent || '20%'
    };
  };

  // Handle page change from pagination component
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
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
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
      {/* Development mode info - will be hidden in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          fontSize: '0.6rem',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 10
        }}>
          Rows: {rowsPerPage} | H: {windowHeight}px
        </Box>
      )}

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
      <Box
        className="main-content"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: 'calc(100% - 10px)',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden'
        }}
      >
        {/* Loading indicator */}
        <React.Fragment>
          {/* Table Container */}
          <TableContainer
            component={Paper}
            className="results-table-container"
            elevation={0}
            sx={{
              width: '100%',
              height: 'auto', minHeight: Math.max(70, (rowsPerPage * ROW_HEIGHT_PX)),
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              boxShadow: 'none',
              background: theme.palette.background.paper,
              overflowY: 'hidden',
              overflowX: 'hidden',
              marginBottom: 0,
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                width: '100%',
                border: '1px solid',
                borderColor: theme.palette.divider,
                tableLayout: 'fixed',
                borderRadius: 0,
                background: theme.palette.background.paper,
                overflowY: 'hidden',
                '& .MuiTableRow-root': {
                  userSelect: 'none',
                  transition: 'all 0.2s ease-in-out'
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              {/* Table Headers */}
              <TableHead>
                <TableRow>
                  {dynamicHeaders.map((header) => {
                    const columnWidth = getColumnWidth(header);
                    return (
                      <TableCell
                        key={header}
                        className={`table-cell-resizable ${header === "abbrName" ? "keyword-column" :
                          header === "longNameEn" ? "english-column" :
                            header === "longNameDe" ? "german-column" :
                              header === "domainName" ? "domain-column" :
                                "category-column"
                          }`}
                        sx={{
                          ...tableHeaderCellStyle,
                          maxWidth: columnWidth.maxWidth,
                          width: {
                            xs: columnWidth.width,
                            sm: columnWidth.width,
                            md: columnWidth.width,
                            lg: columnWidth.width,
                          }
                        }}
                      >
                        {HEADER_LABELS[header] || header}
                      </TableCell>
                    );
                  })}
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
                        height: '18px',
                        maxHeight: '18px',
                        py: 0.2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        userSelect: 'none'
                      }}
                    >
                      <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {getEmptyMessage()}
                      </Typography>
                    </TableCell>
                  </TableRow>) : (
                  paginatedRows.map((row, index) => {
                    // Check if this row is for an obsolete label and has a replacement
                    const isObsolete = String(row.lifeCycleState || '').toLowerCase() === 'obsolete';
                    const hasReplacement = !!row.useInstead;
                    const shouldShowTooltip = isObsolete && hasReplacement;

                    // Get the replacement text for tooltip
                    const getReplacementText = () => {
                      if (!row.useInstead) return '';
                      return row.useInsteadAbbrName
                        ? `This label is obsolete. Use instead: ${row.useInsteadAbbrName}`
                        : `This label is obsolete. Use instead: ${row.useInstead}`;
                    };

                    // Wrap with tooltip if needed, otherwise return just the row
                    const tableRow = (
                      <TableRow
                        key={index}
                        className={String(row.lifeCycleState || '').toLowerCase() === 'valid' ? 'row-valid' : 'row-invalid'}
                        sx={{
                          fontSize: '0.7rem',
                          background: theme.palette.background.paper,
                          height: '18px',
                          maxHeight: '18px',
                          ...tableRowHoverStyle,
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '3px',
                            height: '100%',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.2s ease'
                          },
                          '&:hover::after': {
                            backgroundColor: theme.palette.primary.main
                          },
                          '&:focus-within': {
                            outline: 'none',
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(25, 118, 210, 0.15)'
                          },
                          // Add visual indication for obsolete labels with replacements
                          // ...(shouldShowTooltip && {
                          //   '& .MuiTableCell-root': {
                          //     borderColor: theme.palette.warning.main,
                          //   },
                          //   '&:hover .MuiTableCell-root': {
                          //     borderColor: theme.palette.warning.dark,
                          //   }
                          // })
                        }}
                      >
                        {dynamicHeaders.map(header => (
                          <TableCell key={header} sx={tableCellStyle}>
                            {header === 'rbClassifications' && Array.isArray(row[header])
                              ? row[header].join(", ")
                              : (row[header] ?? '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    );

                    // If this row should have a tooltip, wrap it
                    return shouldShowTooltip ? (
                      <Tooltip
                        key={`tooltip-${index}`}
                        title={getReplacementText()}
                        arrow
                        placement="bottom-start"
                        sx={{
                          '& .MuiTooltip-tooltip': {
                            backgroundColor: theme.palette.warning.light,
                            color: theme.palette.warning.contrastText,
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            padding: '6px 10px',
                            border: `1px solid ${theme.palette.warning.main}`,
                            maxWidth: '250px'
                          },
                          '& .MuiTooltip-arrow': {
                            color: theme.palette.warning.light
                          }
                        }}
                      >
                        {tableRow}
                      </Tooltip>
                    ) : tableRow;
                  })
                )}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalCount > rowsPerPage && (
              <Box sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                py: 0.5,
                mt: 0,
                position: 'sticky',
                bottom: 0,
                background: theme.palette.background.paper,
                borderTop: `1px solid ${theme.palette.divider}`,
                zIndex: 1,
                marginBottom: 2,
                paddingBottom: 2
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
                      minWidth: 20,
                      height: 20,
                      margin: '0 1px',
                      padding: 0
                    }
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </React.Fragment>
      </Box>
    </Box>
  );
};

export default ResultTable;