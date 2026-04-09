/**
 * Sanitizes a username to be lowercase, without spaces and without special characters.
 * Allowed characters: a-z, 0-9, . , _
 * 
 * @param username The raw username input
 * @returns The sanitized username
 */
export const sanitizeUsername = (username: string): string => {
  if (!username) return '';
  
  return username
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9._]/g, ''); // Remove any other non-allowed characters
};
