/**
 * Hyperliquid data formatting functions
 * Contains utility functions for formatting data from the Hyperliquid API
 */

/**
 * Format account balances for display
 * @param {Object} accountData Account data from Hyperliquid API
 * @returns {Array} Formatted account balances
 */
export function formatAccountBalances(accountData) {
  if (!accountData || !accountData.balance) {
    return [];
  }
  
  const balances = [];
  
  // Process free and used balances
  if (accountData.balance.free) {
    Object.entries(accountData.balance.free).forEach(([coin, amount]) => {
      if (amount > 0) {
        const used = accountData.balance.used && accountData.balance.used[coin] 
          ? accountData.balance.used[coin] 
          : 0;
        
        const totalBalance = amount + used;
        
        // Calculate USDC value if available
        let usdcValue = 0;
        if (coin === 'USDC' || coin === 'USDT' || coin === 'USD') {
          usdcValue = totalBalance;
        } else if (accountData.balance.info && accountData.balance.info.usdcValue) {
          // Try to get USDC value from info if available
          usdcValue = accountData.balance.info.usdcValue[coin] || 0;
        }
        
        balances.push({
          coin,
          totalBalance,
          availableBalance: amount,
          usdcValue
        });
      }
    });
  }
  
  // Process total balances if free/used not available
  if (balances.length === 0 && accountData.balance.total) {
    Object.entries(accountData.balance.total).forEach(([coin, amount]) => {
      if (amount > 0) {
        // Calculate USDC value if available
        let usdcValue = 0;
        if (coin === 'USDC' || coin === 'USDT' || coin === 'USD') {
          usdcValue = amount;
        } else if (accountData.balance.info && accountData.balance.info.usdcValue) {
          // Try to get USDC value from info if available
          usdcValue = accountData.balance.info.usdcValue[coin] || 0;
        }
        
        balances.push({
          coin,
          totalBalance: amount,
          availableBalance: amount, // Assume all available if no free/used breakdown
          usdcValue
        });
      }
    });
  }
  
  // Process Hyperliquid-specific account data if available
  if (balances.length === 0 && accountData.hyperliquidSpecific) {
    // Implementation depends on the specific structure of Hyperliquid data
    // This is a placeholder for Hyperliquid-specific formatting
    console.log('Using Hyperliquid-specific account data format');
    
    if (accountData.hyperliquidSpecific.assetPositions) {
      accountData.hyperliquidSpecific.assetPositions.forEach(position => {
        if (position.coin && position.balance) {
          balances.push({
            coin: position.coin,
            totalBalance: position.balance,
            availableBalance: position.availableBalance || position.balance,
            usdcValue: position.usdValue || 0
          });
        }
      });
    }
  }
  
  // Sort by USDC value (highest first)
  return balances.sort((a, b) => b.usdcValue - a.usdcValue);
}

/**
 * Format positions data for display
 * @param {Array} positionsData Positions data from Hyperliquid API
 * @param {Object} marketPrices Market prices for symbols
 * @returns {Array} Formatted positions
 */
export function formatPositions(positionsData, marketPrices = {}) {
  console.log('Formatting positions data:', positionsData);
  console.log('Market prices provided:', marketPrices);
  
  if (!positionsData || !Array.isArray(positionsData)) {
    console.log('No positions data or not an array, returning empty array');
    return [];
  }
  
  if (positionsData.length === 0) {
    console.log('Positions data is an empty array');
    return [];
  }
  
  // Handle different position data structures
  const formattedPositions = positionsData.map(position => {
    console.log('Processing position:', position);
    
    // Extract the base symbol (e.g., "BTC" from "BTC/USDT:USDT")
    const symbol = formatSymbol(position.symbol || position.info?.symbol || position.coin || '');
    const fullSymbol = position.symbol || position.info?.symbol || '';
    
    // Handle different position data structures
    const side = position.side || 
                (position.positionAmt > 0 ? 'long' : 'short') || 
                (position.amount > 0 ? 'long' : 'short') ||
                'unknown';
    
    // Extract size with multiple fallbacks
    let size = 0;
    if (position.size !== undefined && position.size !== null) {
      size = Math.abs(parseFloat(position.size));
    } else if (position.positionAmt !== undefined && position.positionAmt !== null) {
      size = Math.abs(parseFloat(position.positionAmt));
    } else if (position.amount !== undefined && position.amount !== null) {
      size = Math.abs(parseFloat(position.amount));
    } else if (position.contracts !== undefined && position.contracts !== null) {
      size = Math.abs(parseFloat(position.contracts));
    } else if (position.info && position.info.size !== undefined) {
      size = Math.abs(parseFloat(position.info.size));
    }
    
    // Extract entry price with fallbacks
    const entryPrice = parseFloat(position.entryPrice || position.avgPrice || position.entry_price || position.info?.entryPrice || 0);
    
    // Get mark price from market prices if available
    let markPrice = 0;
    if (marketPrices && marketPrices[fullSymbol]) {
      markPrice = parseFloat(marketPrices[fullSymbol]);
      console.log(`Using market price for ${fullSymbol}:`, markPrice);
    } else if (marketPrices && marketPrices[symbol]) {
      markPrice = parseFloat(marketPrices[symbol]);
      console.log(`Using market price for base symbol ${symbol}:`, markPrice);
    } else if (position.markPrice !== undefined && position.markPrice !== null) {
      markPrice = parseFloat(position.markPrice);
    } else if (position.mark_price !== undefined && position.mark_price !== null) {
      markPrice = parseFloat(position.mark_price);
    } else if (position.lastPrice !== undefined && position.lastPrice !== null) {
      markPrice = parseFloat(position.lastPrice);
    } else if (position.info && position.info.markPrice !== undefined) {
      markPrice = parseFloat(position.info.markPrice);
    }
    
    // Calculate PnL
    let pnl = parseFloat(position.unrealizedPnl || position.pnl || position.unrealizedProfit || 0);
    let pnlPercentage = position.pnlPercentage || 0;
    
    // If pnlPercentage is not provided, calculate it
    if (!pnlPercentage && entryPrice > 0) {
      const priceDiff = side === 'long' ? markPrice - entryPrice : entryPrice - markPrice;
      pnlPercentage = (priceDiff / entryPrice * 100).toFixed(2);
    }
    
    // Extract other properties with fallbacks
    const leverage = parseFloat(position.leverage || position.marginMode || 1);
    const liquidationPrice = parseFloat(position.liquidationPrice || position.liq_price || 0);
    const margin = parseFloat(position.margin || position.collateral || position.initialMargin || 0);
    
    console.log(`Formatted position - Symbol: ${symbol}, Size: ${size}, Mark: ${markPrice}`);
    
    return {
      symbol,
      fullSymbol,
      side,
      size,
      entryPrice,
      markPrice,
      pnl,
      pnlPercentage,
      leverage,
      liquidationPrice,
      margin
    };
  });
  
  console.log('Formatted positions:', formattedPositions);
  return formattedPositions;
}

/**
 * Format symbol for display
 * @param {String} symbol Symbol from API
 * @returns {String} Formatted symbol
 */
export function formatSymbol(symbol) {
  if (!symbol) return '';
  
  // Handle different symbol formats
  if (symbol.includes('/')) {
    // Format: BTC/USDT:USDT -> BTC
    return symbol.split('/')[0];
  } else if (symbol.includes('-')) {
    // Format: BTC-USDT -> BTC
    return symbol.split('-')[0];
  }
  
  return symbol;
}

/**
 * Format number for display
 * @param {Number} value Number to format
 * @param {Number} decimals Number of decimal places (null for auto)
 * @returns {String} Formatted number
 */
export function formatNumber(value, decimals = null) {
  if (value === undefined || value === null) return '-';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numValue)) return '-';
  
  // Determine number of decimal places
  let decimalPlaces = decimals;
  if (decimalPlaces === null) {
    if (Math.abs(numValue) >= 1000) {
      decimalPlaces = 2;
    } else if (Math.abs(numValue) >= 10) {
      decimalPlaces = 3;
    } else if (Math.abs(numValue) >= 1) {
      decimalPlaces = 4;
    } else {
      decimalPlaces = 6;
    }
  }
  
  return numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
}

/**
 * Format date for display
 * @param {Number} timestamp Timestamp in milliseconds
 * @returns {String} Formatted date
 */
export function formatDate(timestamp) {
  if (!timestamp) return '-';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Calculate PnL percentage
 * @param {Number} pnl PnL amount
 * @param {Number} entryPrice Entry price
 * @param {Number} size Position size
 * @returns {String} PnL percentage as string with % sign
 */
export function calculatePnlPercentage(pnl, entryPrice, size) {
  if (!pnl || !entryPrice || !size) return '0%';
  
  const initialValue = entryPrice * size;
  const percentage = (pnl / initialValue) * 100;
  
  return percentage.toFixed(2) + '%';
}

/**
 * Format orders for display
 * @param {Array} orders Orders data from Hyperliquid API
 * @returns {Array} Formatted orders
 */
export function formatOrders(orders) {
  if (!orders || !Array.isArray(orders)) {
    return [];
  }
  
  return orders.map(order => {
    // Extract symbol
    const symbol = formatSymbol(order.symbol || '');
    
    // Get asset ID (needed for cancel)
    const assetId = order.info?.market || order.info?.assetId || symbol;
    
    // Get order type
    const orderType = order.type || 'limit';
    
    // Get order side
    const side = order.side === 'buy' ? 'Buy' : 'Sell';
    
    // Get order size
    const size = Math.abs(order.amount || order.size || 0);
    
    // Get filled amount
    const filled = order.filled || 0;
    
    // Calculate order value
    const value = (order.price || 0) * size;
    
    // Get order price
    const price = order.price || 0;
    
    // Get reduce only flag
    const reduceOnly = order.reduceOnly || false;
    
    // Get order status
    const status = order.status || 'open';
    
    // Get order timestamp
    const timestamp = order.timestamp || Date.now();
    
    return {
      id: order.id,
      symbol,
      assetId,
      orderType,
      side,
      size,
      filled,
      value,
      price,
      reduceOnly,
      status,
      timestamp,
      raw: order
    };
  });
}
