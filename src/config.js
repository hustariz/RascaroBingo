/**
 * Application Configuration
 * 
 * This file contains global configuration values used throughout the application.
 */

// API URL configuration
export const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3004/api';

// Other global configuration values
export const APP_NAME = 'RascaroBingo';
export const APP_VERSION = '1.0.0';

// Default request timeout (in milliseconds)
export const DEFAULT_TIMEOUT = 30000;

// WebSocket configuration
export const WS_RECONNECT_INTERVAL = 5000;
