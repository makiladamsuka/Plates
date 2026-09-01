export interface GoogleContact {
  resourceName?: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
}

export class GoogleContactsError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'GoogleContactsError';
    this.code = code;
  }
}

/**
 * Fetches and parses contacts from the Google People API using the Supabase Google provider_token.
 *
 * @param providerToken Google access token from session.provider_token
 * @returns Clean array of contacts with names, emails, phones, and photos
 */
export async function fetchGoogleContacts(providerToken: string): Promise<GoogleContact[]> {
  if (!providerToken) {
    throw new GoogleContactsError('No Google provider token found. Please sign in with Google.', 'NO_TOKEN');
  }

  const endpoint = new URL('https://people.googleapis.com/v1/people/me/connections');
  endpoint.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos');
  endpoint.searchParams.set('pageSize', '100');
  endpoint.searchParams.set('sortOrder', 'FIRST_NAME_ASCENDING');

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const status = response.status;

      if (status === 401) {
        throw new GoogleContactsError(
          'Google access token has expired or is invalid. Please sign in with Google again.',
          'UNAUTHORIZED'
        );
      } else if (status === 403) {
        throw new GoogleContactsError(
          'Permission denied. You have not granted access to Google Contacts.',
          'PERMISSION_DENIED'
        );
      } else {
        throw new GoogleContactsError(
          errorBody?.error?.message || `Google People API error (${status})`,
          'API_ERROR'
        );
      }
    }

    const data = await response.json();
    const connections: any[] = data.connections || [];

    const parsedContacts: GoogleContact[] = connections
      .map((person: any): GoogleContact | null => {
        // 1. Extract Primary / Display Name
        const nameObj = person.names?.find((n: any) => n.metadata?.primary) || person.names?.[0];
        const displayName = nameObj?.displayName || nameObj?.givenName || null;

        // 2. Extract Primary Email
        const emailObj = person.emailAddresses?.find((e: any) => e.metadata?.primary) || person.emailAddresses?.[0];
        const email = emailObj?.value || null;

        // 3. Extract Primary Phone Number
        const phoneObj = person.phoneNumbers?.find((p: any) => p.metadata?.primary) || person.phoneNumbers?.[0];
        const phoneNumber = phoneObj?.value || null;

        // 4. Extract Photo URL (ignoring default placeholder if available)
        const photoObj = person.photos?.find((p: any) => p.metadata?.primary) || person.photos?.[0];
        const photoUrl = (photoObj && !photoObj.default) ? photoObj.url : null;

        // Filter out empty contact records
        if (!displayName && !email && !phoneNumber) {
          return null;
        }

        return {
          resourceName: person.resourceName,
          name: displayName || email?.split('@')[0] || 'Unknown Contact',
          email,
          phoneNumber,
          photoUrl,
        };
      })
      .filter((contact): contact is GoogleContact => contact !== null);

    return parsedContacts;
  } catch (err: any) {
    if (err instanceof GoogleContactsError) {
      throw err;
    }
    throw new GoogleContactsError(
      err.message || 'Failed to fetch contacts from Google People API.',
      'NETWORK_ERROR'
    );
  }
}
