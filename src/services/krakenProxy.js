import axios from 'axios';

class KrakenProxy {
  constructor() {
    this.baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3004';
  }

  // Helper function to format pair for Kraken API
  formatPair(pair) {
    // Convert XBT/USD to XBTUSD format
    return pair.replace('/', '');
  }

  // Make private API call through our backend
  async privateMethod(method, data = {}) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/api/kraken/${method}`,
        data
      });

      return response.data;
    } catch (error) {
      console.error('Kraken API error:', {
        method,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  // Make public API call through our backend
  async publicMethod(method, params = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/kraken/public/${method}`,
        { params }
      );

      return response.data;
    } catch (error) {
      console.error('Kraken API error:', error);
      throw error;
    }
  }

  // Get account balance
  getBalance() {
    return this.privateMethod('balance');
  }

  // Get open orders
  getOpenOrders() {
    return this.privateMethod('openOrders');
  }

  // Get closed orders
  getClosedOrders() {
    return this.privateMethod('closedOrders');
  }

  // Get ticker information
  getTicker(pair) {
    return this.publicMethod('ticker', { pair: this.formatPair(pair) });
  }

  // Place a new order
  addOrder(orderData) {
    return this.privateMethod('addOrder', orderData);
  }

  // Cancel an order
  cancelOrder(orderId) {
    return this.privateMethod('cancelOrder', { txid: orderId });
  }

  // Futures API methods
  async futuresTotalMethod(method, params = {}) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/api/kraken/futures/${method}`,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Kraken Futures API error:', {
        method,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  // Get futures positions
  async getFuturesPositions() {
    return this.futuresTotalMethod('positions');
  }

  // Get futures tickers
  getFuturesTickers() {
    return this.futuresTotalMethod('tickers');
  }

  // Get futures accounts
  getFuturesAccounts() {
    return this.futuresTotalMethod('accounts');
  }

  // Get futures orders
  getFuturesOrders() {
    return this.futuresTotalMethod('orders');
  }

  // Get futures orderbook
  getFuturesOrderbook(symbol) {
    return this.futuresTotalMethod('orderbook', { symbol });
  }
}

export default new KrakenProxy();
