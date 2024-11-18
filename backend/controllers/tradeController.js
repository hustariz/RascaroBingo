// controllers/tradeController.js
const Trade = require('../models/Trade');

exports.createTrade = async (req, res) => {
    try {
      console.log('Creating trade with user:', req.user.id);
      console.log('Trade data:', req.body);
  
      const trade = new Trade({
        ...req.body,
        userId: req.user.id
      });
      
      const savedTrade = await trade.save();
      console.log('Trade saved successfully:', savedTrade);
      res.status(201).json(savedTrade);
    } catch (error) {
      console.error('Error creating trade:', error);
      res.status(400).json({ message: error.message });
    }
  };

exports.getTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id })
      .sort({ timestamp: -1 });
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json(trade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const trade = await Trade.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTradeStatus = async (req, res) => {
    try {
      const { tradeId } = req.params;
      const { status } = req.body;
  
      const trade = await Trade.findOneAndUpdate(
        { _id: tradeId, userId: req.user.id },
        { status },
        { new: true }
      );
  
      if (!trade) {
        return res.status(404).json({ message: 'Trade not found' });
      }
  
      res.json(trade);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };