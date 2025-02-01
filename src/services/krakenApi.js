import CryptoJS from 'crypto-js';
import axios from 'axios';

class KrakenApi {
  constructor() {
    this.baseUrl = 'https://api.kraken.com';
    this.version = '0';
    
    // Try both VUE_APP and VITE prefixes
    this.apiKey = process.env.VITE_KRAKEN_API_KEY || process.env.VUE_APP_KRAKEN_API_KEY;
    this.apiSecret = process.env.VITE_KRAKEN_API_SECRET || process.env.VUE_APP_KRAKEN_API_SECRET;

    // Debug environment variables (without exposing secrets)
    console.log('Kraken API Configuration:', {
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
      envKeys: Object.keys(process.env).filter(key => key.includes('KRAKEN'))
    });
  }

  // Generate Kraken API signature
  generateSignature(path, nonce, postData) {
    const message = postData ? 
      nonce + JSON.stringify(postData) :
      nonce;
    
    // Decode the base64 secret
    const secret = CryptoJS.enc.Base64.parse(this.apiSecret);
    
    // Create the SHA256 hash
    const hash = CryptoJS.SHA256(nonce + message);
    
    // Create the HMAC-SHA512
    const hmac = CryptoJS.HmacSHA512(
      path + CryptoJS.enc.Hex.stringify(hash),
      secret
    );
    
    // Convert to base64
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  // Make private API call
  async privateMethod(method, data = {}) {
    if (!this.apiKey || !this.apiSecret) {
      console.error('Kraken API credentials missing:', {
        hasApiKey: !!this.apiKey,
        hasApiSecret: !!this.apiSecret,
        availableEnvVars: Object.keys(process.env)
      });
      throw new Error('Kraken API credentials not configured');
    }

    const path = `/${this.version}/private/${method}`;
    const nonce = Date.now().toString();
    const postData = { ...data, nonce };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}${path}`,
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': this.generateSignature(path, nonce, postData)
        },
        data: postData
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(response.data.error.join(', '));
      }

      return response.data.result;
    } catch (error) {
      console.error('Kraken API error:', {
        method,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  // Make public API call
  async publicMethod(method, params = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.version}/public/${method}`,
        { params }
      );

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(response.data.error.join(', '));
      }

      return response.data.result;
    } catch (error) {
      console.error('Kraken API error:', error);
      throw error;
    }
  }

  // Get account balance
  getBalance() {
    return this.privateMethod('Balance');
  }

  // Get open orders
  getOpenOrders() {
    return this.privateMethod('OpenOrders');
  }

  // Get closed orders
  getClosedOrders() {
    return this.privateMethod('ClosedOrders');
  }

  // Get ticker information
  getTicker(pair) {
    return this.publicMethod('Ticker', { pair });
  }

  // Place a new order
  async addOrder({
    pair,
    type,
    ordertype,
    price,
    volume,
    leverage,
    stopLoss,
    takeProfit
  }) {
    const orderData = {
      pair,
      type, // 'buy' or 'sell'
      ordertype, // 'limit', 'market', etc.
      volume,
    };

    if (ordertype === 'limit') {
      orderData.price = price;
    }

    if (leverage) {
      orderData.leverage = leverage;
    }

    if (stopLoss) {
      orderData['close[ordertype]'] = 'stop-loss';
      orderData['close[price]'] = stopLoss;
    }

    if (takeProfit) {
      orderData['close[ordertype]'] = 'take-profit';
      orderData['close[price]'] = takeProfit;
    }

    return this.privateMethod('AddOrder', orderData);
  }

  // Cancel an order
  cancelOrder(orderId) {
    return this.privateMethod('CancelOrder', { txid: orderId });
  }
}

export default new KrakenApi();
