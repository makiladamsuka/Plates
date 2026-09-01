export interface DeviceContact {
  name: string[];
  tel?: string[];
  email?: string[];
  icon?: Blob[];
}

export interface CleanContact {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * Checks whether the native Web Contacts Picker API is supported in the current browser/device.
 */
export function isDeviceContactsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

/**
 * Invokes the device's native contact picker to select phone contacts directly.
 * 
 * Works natively on supported mobile browsers (Chrome for Android, Edge, Samsung Internet, Opera Mobile).
 */
export async function getDevicePhoneContacts(): Promise<CleanContact[]> {
  if (!isDeviceContactsSupported()) {
    throw new Error('Device Contact Picker is not supported on this browser. Please use Chrome/Edge on mobile, or search by name/@username.');
  }

  try {
    const supportedProperties: string[] = await (navigator as any).contacts.getProperties();
    const propsToRequest: string[] = ['name', 'tel'];

    if (supportedProperties.includes('email')) propsToRequest.push('email');
    if (supportedProperties.includes('icon')) propsToRequest.push('icon');

    const rawContacts: DeviceContact[] = await (navigator as any).contacts.select(propsToRequest, {
      multiple: true,
    });

    if (!rawContacts || rawContacts.length === 0) {
      return [];
    }

    const cleanList: CleanContact[] = rawContacts.map((contact, index) => {
      const displayName = Array.isArray(contact.name) && contact.name.length > 0
        ? contact.name[0]
        : 'Contact';

      const primaryTel = Array.isArray(contact.tel) && contact.tel.length > 0
        ? contact.tel[0].trim()
        : null;

      const primaryEmail = Array.isArray(contact.email) && contact.email.length > 0
        ? contact.email[0].trim().toLowerCase()
        : null;

      let avatarUrl: string | null = null;
      if (Array.isArray(contact.icon) && contact.icon.length > 0 && contact.icon[0] instanceof Blob) {
        try {
          avatarUrl = URL.createObjectURL(contact.icon[0]);
        } catch {
          avatarUrl = null;
        }
      }

      return {
        id: `device-contact-${index}-${Date.now()}`,
        name: displayName,
        phoneNumber: primaryTel,
        email: primaryEmail,
        avatarUrl,
      };
    });

    return cleanList;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.code === 20) {
      // User dismissed or cancelled the native contact picker dialog
      return [];
    }
    console.error('Failed to access device contacts:', err);
    throw err;
  }
}
