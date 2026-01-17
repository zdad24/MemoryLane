/**
 * TwelveLabs Client Configuration
 */

const { TwelveLabs } = require('twelvelabs-js');

let client = null;

/**
 * Initialize TwelveLabs client
 * @returns {TwelveLabs} TwelveLabs client instance
 */
const initializeTwelveLabs = () => {
  if (client) {
    return client;
  }

  const apiKey = process.env.TWELVELABS_API_KEY;

  if (!apiKey) {
    console.warn('[TwelveLabs] API key not configured');
    return null;
  }

  try {
    client = new TwelveLabs({ apiKey });
    console.log('[TwelveLabs] Client initialized');
    return client;
  } catch (error) {
    console.error('[TwelveLabs] Initialization error:', error.message);
    throw error;
  }
};

/**
 * Get TwelveLabs client instance
 * @returns {TwelveLabs} TwelveLabs client instance
 */
const getClient = () => {
  if (!client) {
    return initializeTwelveLabs();
  }
  return client;
};

module.exports = {
  initializeTwelveLabs,
  getClient,
};
