// controllers/bingoController.js
const BingoCard = require('../models/BingoCard');
const User = require('../models/User');

exports.getCard = async (req, res) => {
  try {
    console.log(' [GET] Fetching bingo card for user:', req.user?.id);
    
    // Validate user
    if (!req.user?.id) {
      console.log(' [GET] No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'No user ID found in request'
      });
    }

    // Find or create card using findOneAndUpdate
    console.log(' [GET] Finding/creating card for user:', req.user.id);
    const card = await BingoCard.findOneAndUpdate(
      { userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
          bingoPages: [{
            id: 1,
            name: 'Default Board',
            bingoCells: Array.from({ length: 25 }, (_, i) => ({
              id: i + 1,
              title: '',
              points: 0,
              selected: false
            }))
          }],
          currentPageIndex: 0,
          lastModified: new Date()
        }
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if it doesn't exist
        runValidators: true
      }
    );

    console.log(' [GET] Card retrieved:', card ? 'Found' : 'Not found');
    
    res.json({
      success: true,
      data: card.toJSON()
    });
  } catch (error) {
    console.error(' [GET] Error fetching bingo card:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server Error',
      details: error.stack
    });
  }
};

exports.updateCard = async (req, res) => {
  try {
    console.log(' [UPDATE] Received update request for user:', req.user?.id);
    console.log(' [UPDATE] Request body:', JSON.stringify(req.body, null, 2));

    // Validate user
    if (!req.user?.id) {
      console.log(' [UPDATE] No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'No user ID found in request'
      });
    }
    
    // Get the data from request body
    const { bingoPages, currentPageIndex = 0 } = req.body;
    
    if (!bingoPages || !Array.isArray(bingoPages)) {
      console.log(' [UPDATE] Invalid data format - pages:', bingoPages);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid bingo data format',
        details: 'Expected bingoPages array in request body'
      });
    }

    // Format and validate pages
    const formattedPages = bingoPages.map((page, index) => {
      // Ensure page has required fields
      if (!page || !page.bingoCells || !Array.isArray(page.bingoCells)) {
        console.log(' [UPDATE] Invalid page format:', page);
        throw new Error(`Invalid page format for page ${index}`);
      }

      // Ensure exactly 25 cells
      let bingoCells = [...page.bingoCells];
      while (bingoCells.length < 25) {
        bingoCells.push({
          id: bingoCells.length + 1,
          title: '',
          points: 0,
          selected: false
        });
      }
      if (bingoCells.length > 25) {
        bingoCells = bingoCells.slice(0, 25);
      }

      return {
        id: page.id || Date.now() + index,
        name: page.name || `Board ${index + 1}`,
        bingoCells: bingoCells.map((cell, cellIndex) => ({
          id: cell?.id || cellIndex + 1,
          title: cell?.title || '',
          points: typeof cell?.points === 'number' ? cell.points : 0,
          selected: !!cell?.selected
        }))
      };
    });

    // Find or create card using findOneAndUpdate
    console.log(' [UPDATE] Finding/updating card for user:', req.user.id);
    const card = await BingoCard.findOneAndUpdate(
      { userId: req.user.id },
      { 
        bingoPages: formattedPages,
        currentPageIndex,
        lastModified: new Date()
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true // Run schema validators
      }
    );

    console.log(' [UPDATE] Card updated successfully:', JSON.stringify(card.toJSON(), null, 2));
    
    res.json({
      success: true,
      data: card.toJSON()
    });
  } catch (error) {
    console.error(' [UPDATE] Error updating bingo card:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server Error',
      details: error.stack
    });
  }
};

exports.updateCell = async (req, res) => {
  try {
    const { pageIndex, cellIndex, cell } = req.body;
    
    if (typeof pageIndex !== 'number' || typeof cellIndex !== 'number' || !cell) {
      return res.status(400).json({ success: false, message: 'Invalid cell update data' });
    }

    let card = await BingoCard.findOne({ userId: req.user.id });
    
    if (!card) {
      return res.status(404).json({ success: false, message: 'Bingo card not found' });
    }

    if (!card.bingoPages[pageIndex]) {
      return res.status(400).json({ success: false, message: 'Invalid page index' });
    }

    if (!card.bingoPages[pageIndex].bingoCells[cellIndex]) {
      return res.status(400).json({ success: false, message: 'Invalid cell index' });
    }

    // Update the cell
    card.bingoPages[pageIndex].bingoCells[cellIndex] = {
      ...card.bingoPages[pageIndex].bingoCells[cellIndex],
      ...cell,
      title: cell.title || '',
      points: Number(cell.points) || 0,
      selected: !!cell.selected
    };

    card.lastModified = new Date();
    await card.save();

    res.json({
      success: true,
      data: {
        bingoPages: card.bingoPages,
        currentPageIndex: card.currentPageIndex,
        lastModified: card.lastModified
      }
    });
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};