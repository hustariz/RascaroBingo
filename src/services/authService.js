/**
 * Authentication Service
 * 
 * This service provides methods for handling authentication tokens
 * and is used by other API services to include authentication in requests.
 */

// Simple service to get the authentication token from localStorage
const authService = {
  /**
   * Get the current authentication token
   * @returns {string|null} The authentication token or null if not authenticated
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if the user is authenticated
   * @returns {boolean} True if the user is authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Get the authentication headers for API requests
   * @returns {Object} Headers object with Authorization header if authenticated
   */
  getAuthHeaders() {
    const token = this.getToken();
    return token ? {
      headers: {
        Authorization: `Bearer ${token}`
      }
    } : {};
  }
};

export default authService;
