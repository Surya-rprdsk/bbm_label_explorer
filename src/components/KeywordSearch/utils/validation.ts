// Moved from types.ts
export interface Keyword {
  [key: string]: string | string[] | undefined;
  shortName?: string;
  abbrName?: string;
  longNameEn?: string;
  longNameDe?: string;
  descriptionEn?: string;
  descriptionDe?: string;
  domainName?: string;
  category?: string;
  rbClassifications?: string[];
  autosarClassifications?: string[];
  lifeCycleState?: string;
  state?: string;
  useInstead?: string;
  useInsteadAbbrName?: string;
}

import { logError, logDebug, logInfo} from '../../';
import Fuse from 'fuse.js';
import { getSpell } from './spell';
import { stemmer as porterStemmer } from 'porter-stemmer';


// Import and re-export types from fuse.js to avoid namespace errors
type FuseResult<T> = {
  item: T;
  refIndex: number;
  score?: number;
};

/**
 * VALIDATION CONSTANTS
 */
export const ERROR_RANK = [
  'No Label',
  'Abbreviation of <pp> not available',
  'Physical part <pp> is missing',
  'DescriptiveName part <dd> is missing',
  'Duplicate keywords used',
  'Abbreviation of <dd> not available',
  'DescriptiveName part <dd> is invalid',
  'Extension <Ex> not available',
  'Extension part <Ex> is invalid',
  'Label exceeds 27 characters'
];

/**
 * TEXT PROCESSING UTILITIES
 */

// Enhanced normalization: replaces hyphens, underscores, commas, and splits camelCase to spaces
export function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[-_,]/g, ' ') // Replace hyphens, underscores, and commas with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase boundaries
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

// Tokenize: split on spaces only
export function tokenize(str: string): string[] {
  return str.split(/\s+/).map(w => w.toLowerCase()).filter(Boolean);
}

// Apply Porter stemmer for English words
export function stem(word: string): string {
  const stemmed = porterStemmer(word);
  if (word !== stemmed) {
    console.log(`[stem] '${word}' -> '${stemmed}'`);
  }
  return stemmed;
}

/**
 * SEARCH FILTERING FUNCTIONS
 */

// Sort search results by relevance
export function sortResults(results: Keyword[], queryTokens: string[]): Keyword[] {
  return results.sort((a, b) => {
    // First priority: valid items over invalid ones
    const aValid = String(a.lifeCycleState).toLowerCase() === 'valid';
    const bValid = String(b.lifeCycleState).toLowerCase() === 'valid';
    if (aValid && !bValid) return -1;
    if (!aValid && bValid) return 1;

    // Second priority: exact match of abbrName to any query token
    const aExactMatch = queryTokens.some(token =>
      a.abbrName && a.abbrName.toLowerCase() === token.toLowerCase()
    );
    const bExactMatch = queryTokens.some(token =>
      b.abbrName && b.abbrName.toLowerCase() === token.toLowerCase()
    );
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    // Third priority: length of abbrName (shorter is better)
    if (a.abbrName && b.abbrName) {
      if (a.abbrName.length !== b.abbrName.length) {
        return a.abbrName.length - b.abbrName.length;
      }
    }

    // Fourth priority: alphabetical order
    return (a.abbrName || '').localeCompare(b.abbrName || '');
  });
}

// Main search filter function
export function filterData(
  data: Keyword[],
  query: string,
  useFuzzy: boolean = true,
  useSpellCheck: boolean = true,
  useStemming: boolean = true
): Keyword[] {
  // Normalize and tokenize the query
  const normalizedQuery = normalize(query);
  let queryTokens = tokenize(normalizedQuery);

  // Log only the separated keywords
  console.log('[filterData] Separated keywords:', queryTokens);

  // Spell correction
  let expandedQueryTokens: string[] = [...queryTokens];

  if (useSpellCheck) {
    const spell = getSpell('en');
    if (spell) {
      // Only push suggestions, not the incorrectly spelled word
      expandedQueryTokens = [];
      queryTokens.forEach(word => {
        if (/^[A-Z0-9]{2,}$/.test(word) || (word.length <= 4 && word === word.toUpperCase()) || !/[aeiou]/i.test(word)) {
          expandedQueryTokens.push(word);
          return;
        }
        if (!spell.correct(word)) {
          const suggestions = spell.suggest(word).slice(0, 2);
          console.log(`[spell] '${word}' suggestions:`, suggestions);
          expandedQueryTokens.push(...suggestions);
        } else {
          console.log(`[spell] '${word}' is correct`);
          expandedQueryTokens.push(word);
        }
      });
    }
  }

  // Log the final list of keywords after spell check
  console.log('[filterData] Final keywords after spell check:', expandedQueryTokens);

  // Stemming
  if (useStemming) {
    expandedQueryTokens = expandedQueryTokens.flatMap(token => {
      const stemmed = stem(token);
      return token === stemmed ? [token] : [token, stemmed];
    });
  }
  console.log('[filterData] Final keywords after stemming:', expandedQueryTokens);

  // Exact matching
  const exactMatches = data.filter(item => {
    return expandedQueryTokens.some(token => {
      const lowerToken = token.toLowerCase();
      return (
        (item.abbrName && item.abbrName.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerToken.replace(/[^a-z0-9]/g, '')) ||
        (item.longNameEn && item.longNameEn.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerToken.replace(/[^a-z0-9]/g, '')) ||
        (item.longNameDe && item.longNameDe.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerToken.replace(/[^a-z0-9]/g, ''))
      );
    });
  });
  console.log(exactMatches);

  if (exactMatches.length > 0) {
    return sortResults(exactMatches, expandedQueryTokens);
  }

  // Fuzzy search
  if (useFuzzy) {
    const fuseOptions = {
      includeScore: true,
      threshold: 0.4,
      keys: [
        { name: 'abbrName', weight: 1 },
        { name: 'longNameEn', weight: 0.1 }
      ]
    };
    const fuse = new Fuse(data, fuseOptions);

    // Run fuzzy search for each token
    const fuseResults: FuseResult<Keyword>[] = [];
    const seenItems = new Set<string>();

    for (const token of expandedQueryTokens) {
      const results = fuse.search(token);
      console.log(`[fuzzy] Results for token '${token}':`, results);
      for (const result of results) {
        const id = result.item.abbrName || JSON.stringify(result.item);
        if (!seenItems.has(id)) {
          fuseResults.push(result);
          seenItems.add(id);
        }
      }
    }

    if (fuseResults.length > 0) {
      console.log('[fuzzy] Final fuzzy search results:', fuseResults.map(r => r.item));
      return sortResults(fuseResults.map(r => r.item), expandedQueryTokens);
    }
  }

  return [];
}

// Secondary filter function used in label analysis
export function filterData2(
  data: Keyword[],
  query: string
): Keyword[] {
  if (!query) return [];
  // Case sensitive matching for keywords
  // We don't normalize or tokenize as we need exact case matching
  console.log('[filterData2] Searching for exact match:', query);
  // For filterData2, return all exact case-sensitive matches of abbreviations
  const exactMatches = data.filter(item => {
    return item.abbrName && item.abbrName === query;
  });

  if (exactMatches.length > 1) {
    console.log(`[filterData2] Found ${exactMatches.length} matches for "${query}":`, exactMatches);
  } else if (exactMatches.length === 1) {
    console.log('[filterData2] Found exact match for query:', query);
  } else {
    console.log('[filterData2] No matches found for query:', query);
  }

  return exactMatches;
}

/**
 * LABEL PARSING AND VALIDATION
 */

// Split a label into its components
export function splitLabel(label: string) {
  console.log(`[splitLabel] Processing label input: "${label}"`);

  const regex = /^([A-Za-z0-9]+)_([a-zA-z][a-z0-9]*)([A-Za-z0-9]*)(?:_([A-Za-z0-9]+))?$/;
  
  const match = label.match(regex);
  if (!match) {
    console.log(`[splitLabel] No regex match for label "${label}"`);
    return { id: '', pp: '', keywords: [], ex: '', isIncomplete: false, isInvalid: true };
  }
  
  // Extract the main parts
  const [, id, pp, descriptivePart, ex] = match;
  
  // Process descriptive part to extract camel case components
  let descriptiveKeywords: string[] = [];
  if (descriptivePart) {
    // Extract camel case words - each starting with uppercase letter
    const camelCaseParts = descriptivePart.match(/[A-Z][a-z0-9]*/g);
    if (camelCaseParts) {
      descriptiveKeywords = camelCaseParts;
    }
  }  // Add detailed logging for the split results
  console.log(`[splitLabel] Split for label "${label}": id=${id}, pp=${pp || ''}, descriptiveKeywords=${descriptiveKeywords.join(',')}, ex=${ex || ''}`);
  
  // Include pp as a keyword if present
  const keywords = pp ? [pp, ...descriptiveKeywords] : [...descriptiveKeywords];
  
  // If ex is undefined, set to empty string for compatibility
  return { 
    id, 
    pp: pp || '', 
    keywords, 
    ex: typeof ex === 'undefined' ? '' : ex, 
    isIncomplete: false, 
    hasSingleUpperCase: false 
  };
}

// Check if a label conforms to AUTOSAR naming conventions
export function isAutosarConformantLabel(label: string, data: Keyword[]): 'AUTOSAR Label' | 'No AUTOSAR Label' | 'Abbreviation not Available' {
  const split = splitLabel(label);
  if (!split) return 'Abbreviation not Available';
  // For each keyword, search in data for a matching abbrName or longNameEn/De
  let allFound = true;
  let allAutosar = true; for (const kw of split.keywords) {
    // Case sensitive match for abbrName
    const found = data.find(item =>
      (item.abbrName && item.abbrName === kw)
    );
    if (!found || String(found.lifeCycleState).toLowerCase() !== 'valid' || String(found.state).toLowerCase() !== 'released') {
      allFound = false;
      break;
    }
    if (!found.rbClassifications || !found.rbClassifications.includes('AUTOSAR')) {
      allAutosar = false;
    }
  } if (!allFound) return 'Abbreviation not Available';
  if (allAutosar) return 'AUTOSAR Label';
  return 'No AUTOSAR Label';
}

/**
 * MAIN VALIDATION FUNCTIONS
 */

// Analyze a label input and generate structured data for display
export function getLabelRows(labelInput: string, keywords: Keyword[]) {  // Step 1: Check for invalid characters in the entire label (all parts)
    // No need to filter by state since it's now done in the backend
  const errors: string[] = [];
  //get triimming result
  const trimmedLabel = labelInput.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
  const validLabelAfterTrim = (trimmedLabel.length === labelInput.length);

  //I need to remove all special charaters except underscore
  const cleanedLabel = trimmedLabel.replace(/[^A-Za-z0-9_]/g, '');
  const validLabelAfterClean = (cleanedLabel.length === trimmedLabel.length);

  console.log(`LabelEligibility`, validLabelAfterClean && validLabelAfterTrim);

  let finalLabelEligibility = false;
  const parts = labelInput.split('_');
  if (validLabelAfterClean && validLabelAfterTrim) {
    finalLabelEligibility = parts.length <= 3;
  }
  //if label starts with small letter then it is invalid
  logDebug(`test executed successfully`);
  logInfo(`test executed successfully`);
  logError(`test executed successfully`);  if (!finalLabelEligibility || !/^[A-Z]/.test(labelInput)) {
    const msg = 'No Label';
    return {
      rows: [],
      message: msg,
      color: 'red',
      consolidatedMessages: [{ text: msg, color: 'red' }],
      lifeCycleState: undefined,
      useInstead: undefined,
      useInsteadAbbrName: undefined
    };
  }
  console.log(`Final LabelEligibility`, finalLabelEligibility);
  // Step 2: Split the label according to the pattern <Id>[_<pp>][<DescriptiveName>][_Ex]
  const split = splitLabel(labelInput);
  const { id, pp, keywords: labelParts, ex } = split;

  // Define the type for label rows
  interface LabelRow {
    abbrName: string;
    rbClassifications: string[];
    longNameEn: string;
    longNameDe: string;
    domainName: string;
    lifeCycleState: string;
    _rbClassifications?: string | string[];
  }

  // Prepare rows for display
  const labelRows: LabelRow[] = [];
  // Always add ID row - but search for it in the database first
  if (id) {
    labelRows.push({
      abbrName: id,
      rbClassifications: ["Id"],
      longNameEn: "-",
      longNameDe: "-",
      domainName: "-",
      lifeCycleState: "valid"
    });
  }

  // Step 3: Check for pp presence and validity

  const filtered = filterData2(keywords, pp);
  // Case sensitive match
  let kw = filtered.find(k => 
    k.abbrName === pp && 
    k.rbClassifications && 
    (k.rbClassifications.includes('Physical') || k.rbClassifications.includes('Logical'))
  );
  if (!kw) {
    errors.push('Abbreviation of <pp> not available');
  } else if (!kw.rbClassifications || !kw.rbClassifications.includes('Physical') && !kw.rbClassifications.includes('Logical')) {
    errors.push('Physical part <pp> is missing');
  }
  // Add PP row if it exists (even if invalid)
  if (pp) {
    labelRows.push({
      abbrName: kw?.abbrName ?? pp,
      rbClassifications: Array.isArray(kw?.rbClassifications) ? kw.rbClassifications : (kw?.rbClassifications ? [kw.rbClassifications as string] : ["-"]),
      longNameEn: kw?.longNameEn ?? "-",
      longNameDe: kw?.longNameDe ?? "-",
      domainName: kw?.domainName ?? "-",
      lifeCycleState: kw?.lifeCycleState ?? "-",
    });
  }


  // Step 4: Check for DescriptiveName presence and validity ONLY if pp is valid
  const descParts = labelParts.slice(pp ? 1 : 0);
  console.log(`Desc parts are `, descParts);

  // Track seen keywords to detect duplicates
  const seenKeywords = new Set<string>();
  // Add pp to seen keywords if it exists
  if (pp) seenKeywords.add(pp);
    if (!descParts.length) {
      errors.push('DescriptiveName part <dd> is missing');
    } else {
      descParts.forEach((part) => {
        // Check for duplicates
        if (seenKeywords.has(part)) {
          errors.push(`Duplicate keywords used`);
        }
        seenKeywords.add(part);

        const filtered = filterData2(keywords, part);
        // Case sensitive match
        let kw = filtered.find(k => k.abbrName === part && String(k.rbClassifications).toLowerCase() != 'extension');
        if (!kw) {
          errors.push(`Abbreviation of <dd> not available`);
        } else if (kw.rbClassifications && (kw.rbClassifications.includes('Extension') || kw.rbClassifications.includes('Physical'))) {
          errors.push(`DescriptiveName part <dd> is invalid`);
        }
      });
    }

  // use seenKeywords to filter out duplicates in the labelRows
  const uniqueDescParts = Array.from(new Set(descParts.filter(part => seenKeywords.has(part))));
  console.log(`Unique descriptive parts:`, uniqueDescParts);  // Add descriptive parts rows
  uniqueDescParts.forEach((part) => {
    const filtered = filterData2(keywords, part);
    // Case sensitive match
    let kw = filtered.find(k => k.abbrName === part);
    labelRows.push({
      abbrName: kw?.abbrName ?? part,
      rbClassifications: Array.isArray(kw?.rbClassifications) ? kw.rbClassifications : (kw?.rbClassifications ? [kw.rbClassifications as string] : ["-"]),
      longNameEn: kw?.longNameEn ?? "-",
      longNameDe: kw?.longNameDe ?? "-",
      domainName: kw?.domainName ?? "-",
      lifeCycleState: kw?.lifeCycleState ?? "-",
      // Keep the rbClassifications array for internal use
      _rbClassifications: kw?.rbClassifications ?? []
    });
  });

  // Check max length
  if (labelInput.length > 27) {
    errors.push('Label exceeds 27 characters');
  }
  // // Special case for RB_T pattern - show the T as a separate row
  // if (hasSingleUpperCase) {
  //   const upperCaseLetter = labelInput.split('_')[1];
  //   // Try to find this uppercase letter in the database
  //   const filteredUpperCase = filterData2(keywords, upperCaseLetter);
  //   let kwUpperCase = filteredUpperCase.find(k => k.abbrName === upperCaseLetter);

  //   labelRows.push({
  //     abbrName: upperCaseLetter,
  //     rbClassifications: kwUpperCase?.rbClassifications ?
  //       (Array.isArray(kwUpperCase.rbClassifications) ? kwUpperCase.rbClassifications.join(", ") : kwUpperCase.rbClassifications)
  //       : "Invalid - Expected lowercase for physical part",
  //     longNameEn: kwUpperCase?.longNameEn ?? "-",
  //     longNameDe: kwUpperCase?.longNameDe ?? "-",
  //     domainName: kwUpperCase?.domainName ?? "-",
  //     lifeCycleState: kwUpperCase?.lifeCycleState ?? "invalid",
  //   });
  // }

  // Add Extension row if it exists
  if (ex !== undefined && ex !== '') {
    const filtered = filterData2(keywords, ex);
    let kw1 = filtered.find(k => k.abbrName === ex && String(k.rbClassifications).toLowerCase() === 'extension');
    if (!kw1) {
      errors.push(`Extension <Ex> not available`);
    }
    else if (kw1 && kw1.rbClassifications && (!kw1.rbClassifications.includes('Extension'))) {
      errors.push(`Extension part <Ex> is invalid`);
    }    // Case sensitive match
    let kw = filtered.find(k => k.abbrName === ex && String(k.rbClassifications).toLowerCase() === 'extension');
    labelRows.push({
      abbrName: kw?.abbrName ?? ex,
      rbClassifications: Array.isArray(kw?.rbClassifications) ? kw.rbClassifications : (kw?.rbClassifications ? [kw.rbClassifications as string] : ["-"]),
      longNameEn: kw?.longNameEn ?? "-",
      longNameDe: kw?.longNameDe ?? "-",
      domainName: kw?.domainName ?? "-",
      lifeCycleState: kw?.lifeCycleState ?? "-",
      // Keep the rbClassifications array for internal use
      _rbClassifications: kw?.rbClassifications ?? []
    });
  }
  // Get unique errors and sort them by priority
  const uniqueErrors = Array.from(new Set(errors)).sort((a, b) =>
    ERROR_RANK.indexOf(a) - ERROR_RANK.indexOf(b)
  );
  // Create a consolidated messages array
  const consolidatedMessages: { text: string; color: string }[] = [];
  if (uniqueErrors.length > 0) {
    consolidatedMessages.push({
      text: uniqueErrors[0],
      color: 'red'
    });
  }
  
  // Process each row with obsolete status individually
  labelRows.forEach(row => {
    if (String(row.lifeCycleState || '').toLowerCase() === 'obsolete') {
      // Find the corresponding keyword with useInstead information
      const obsoleteKeyword = keywords.find(k => 
        k.abbrName === row.abbrName && 
        String(k.lifeCycleState || '').toLowerCase() === 'obsolete');
      
      // Add replacement info directly to the row
      if (obsoleteKeyword) {
        (row as any).useInstead = obsoleteKeyword.useInstead;
        (row as any).useInsteadAbbrName = obsoleteKeyword.useInsteadAbbrName;
      }
    }
  });
  
  // Get the first obsolete row for backward compatibility
  const obsoleteRow = labelRows.find(row => 
    String(row.lifeCycleState || '').toLowerCase() === 'obsolete');
    
  // Log for debugging
  console.log('getLabelRows - labelRows:', labelRows);
  console.log('getLabelRows - obsoleteRow:', obsoleteRow);
  
  return {
    rows: labelRows,
    message: consolidatedMessages.length > 0 ? consolidatedMessages[0].text : '',
    color: consolidatedMessages.length > 0 ? consolidatedMessages[0].color : '',
    consolidatedMessages,
    // Use the obsolete row for lifecycle information if found
    lifeCycleState: obsoleteRow?.lifeCycleState || (labelRows.length > 0 ? labelRows[0].lifeCycleState : undefined),

  };
}

// Validate a search input
export function validateSearch(search: string): { isValid: boolean; message?: string } {
  if (!search.trim()) {
    return { isValid: false, message: 'Enter a search term to begin.' };
  }

  if (/[^A-Za-z0-9_\-\s]/.test(search)) {
    return { isValid: false, message: 'Search contains invalid characters.' };
  }

  if (search.length > 50) {
    return { isValid: false, message: 'Search term is too long (max 50 characters).' };
  }

  return { isValid: true };
}
