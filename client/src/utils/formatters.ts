/**
 * Utility functions for formatting data in the application
 */

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @param locale The locale (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number, 
    currency = 'USD', 
    locale = 'en-US'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

/**
 * Format a number with EUR currency symbol at the end
 * @param amount The amount to format
 * @returns Formatted currency string with EUR at the end and space thousand separators
 */
export const formatEUR = (amount: number | string | null): string => {
  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === '') {
    return '0.00 EUR';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN
  if (isNaN(numAmount)) {
    return '0.00 EUR';
  }
  
  // Format with custom thousand and decimal separators
  return formatNumberWithSpaces(numAmount, 2) + ' EUR';
};

/**
 * Format a number with spaces for thousands
 * @param value The number to format
 * @returns Formatted number string with spaces as thousand separators
 */
export const formatNumber = (value: number | string): string => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Format with custom thousand and decimal separators
  return formatNumberWithSpaces(numValue, 0);
};

/**
 * Format a number with space as thousand separator and period as decimal separator
 * @param num The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export const formatNumberWithSpaces = (num: number, decimals: number = 2): string => {
  // Format to fixed decimal places
  const fixed = num.toFixed(decimals);
  
  // Split into whole and decimal parts
  const parts = fixed.split('.');
  
  // Format the whole part with space separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Join back with decimal part if needed
  return decimals > 0 ? parts.join('.') : parts[0];
};

/**
 * Format a date as a string
 * @param date The date to format (Date object or ISO string)
 * @param format The format type ('short', 'medium', 'long', or 'relative')
 * @param locale The locale (default: en-US)
 * @returns Formatted date string
 */
export const formatDate = (
    date: Date | string, 
    format: 'short' | 'medium' | 'long' | 'relative' = 'medium',
    locale = 'en-US'
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'relative') {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
      }
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return rtf.format(-diffInMinutes, 'minute');
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return rtf.format(-diffInHours, 'hour');
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return rtf.format(-diffInDays, 'day');
      }
      
      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
        return rtf.format(-diffInMonths, 'month');
      }
      
      const diffInYears = Math.floor(diffInMonths / 12);
      return rtf.format(-diffInYears, 'year');
    }
    
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = 'numeric';
        options.day = 'numeric';
        break;
      case 'medium':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.weekday = 'long';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        break;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  };

/**
 * Truncate a string to a specified length and add ellipsis
 * @param text The text to truncate
 * @param maxLength The maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength = 50): string => {
    if (text.length <= maxLength) {
      return text;
    }
    
    return `${text.substring(0, maxLength)}...`;
  };

/**
 * Convert a string to title case (first letter of each word capitalized)
 * @param text The text to convert
 * @returns Text in title case
 */
export const toTitleCase = (text: string): string => {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

/**
 * Format a URL for display (remove protocol and trailing slash)
 * @param url The URL to format
 * @returns Formatted URL
 */
export const formatUrl = (url: string): string => {
    return url
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
  };

/**
 * Generate a color based on a string (for consistent color coding)
 * @param str The string to generate a color from
 * @returns Hex color code
 */
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };