export function decodeJwtToken(token: string): any {
    if (!token) {
      throw new Error('Token is required');
    } 
    // Split the token into its components
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT does not have 3 parts');
    } 
    // Decode the payload
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  }