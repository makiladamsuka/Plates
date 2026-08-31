import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cleans the input string to generate a valid username.
 * Converts to lowercase, removes accents, spaces, and special characters.
 *
 * @param input - The input string (e.g. full name or custom username).
 * @returns The cleaned alphanumeric username.
 */
export const cleanUsername = (input: string): string => {
  return (input || '')
    .normalize('NFD') // Decompose combined graphemes (accents) into simple ones
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[^a-zA-Z0-9_]/g, '') // Keep alphanumeric and underscores
    .toLowerCase(); // Convert to lowercase
};

/**
 * Generates a random number with the specified number of digits.
 *
 * @param digits - Number of digits (e.g., 2 for 10-99, 3 for 100-999)
 * @returns A random integer
 */
export const generateRandomNumber = (digits: number): number => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Checks if a username is available in the profiles table.
 *
 * @param username - The username to check.
 * @param supabase - The Supabase client.
 * @param excludeUserId - Optional user ID to exclude (e.g. current user when changing username).
 * @returns True if available, false if taken.
 */
export const isUsernameAvailable = async (
  username: string,
  supabase: SupabaseClient,
  excludeUserId?: string
): Promise<boolean> => {
  if (!username || !supabase) return false;

  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase().trim());

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Error checking username availability:', error);
    return false;
  }

  return !data;
};

/**
 * Generates a unique username by checking against the Supabase profiles table.
 *
 * @param fullName - The user's full name
 * @param supabase - The instantiated Supabase client
 * @returns A guaranteed unique username
 */
export const generateUniqueUsername = async (
  fullName: string,
  supabase: SupabaseClient
): Promise<string> => {
  if (!fullName) fullName = 'user';
  if (!supabase) throw new Error('Supabase client is required');

  const baseUsername = cleanUsername(fullName);

  // Fallback if the user typed only special characters (e.g., "!!!")
  let currentUsername = baseUsername || 'user';

  let isUnique = false;
  let attempts = 0;
  let useThreeDigits = false;

  while (!isUnique) {
    try {
      // Check if username exists in the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', currentUsername)
        .maybeSingle();

      if (error) {
        console.error('Error checking username uniqueness:', error);
        throw error;
      }

      // If data is null/undefined, the username does not exist and is unique!
      if (!data) {
        isUnique = true;
        return currentUsername;
      }

      // If we reach here, the username exists. We need to append a number.
      attempts++;

      // Safety counter: Switch to 3-digit suffix after 10 consecutive failures
      if (attempts >= 10 && !useThreeDigits) {
        useThreeDigits = true;
        console.warn(`[Username Gen] 10 collisions occurred for '${baseUsername}'. Switching to 3-digit suffixes.`);
      }

      // Append random number to the base username
      const suffix = useThreeDigits ? generateRandomNumber(3) : generateRandomNumber(2);
      currentUsername = `${baseUsername}${suffix}`;
    } catch (err: any) {
      throw new Error(`Failed to generate unique username: ${err.message}`);
    }
  }

  return currentUsername;
};

