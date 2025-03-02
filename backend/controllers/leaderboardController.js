const User = require('../models/User');
const Trade = require('../models/Trade');

exports.getLeaderboard = async (req, res) => {
  try {
    // Aggregate user data with their trades
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'trades',
          localField: '_id',
          foreignField: 'user',
          as: 'trades'
        }
      },
      {
        $project: {
          username: 1,
          isPremium: 1,
          trades: {
            $filter: {
              input: '$trades',
              as: 'trade',
              cond: { $in: ['$$trade.status', ['TARGET_HIT', 'STOPLOSS_HIT']] }
            }
          }
        }
      },
      {
        $project: {
          username: 1,
          isPremium: 1,
          trades: 1,
          closedTrades: {
            $size: '$trades'
          },
          wins: {
            $size: {
              $filter: {
                input: '$trades',
                as: 'trade',
                cond: { $eq: ['$$trade.status', 'TARGET_HIT'] }
              }
            }
          },
          totalGain: {
            $sum: {
              $cond: [
                { $ne: ['$trades.actualProfit', null] },
                '$trades.actualProfit',
                0
              ]
            }
          },
          riskRewardRatio: {
            $avg: '$trades.riskRewardRatio'
          }
        }
      },
      {
        $addFields: {
          rawWinrate: {
            $cond: [
              { $eq: ['$closedTrades', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: ['$wins', '$closedTrades']
                  },
                  100
                ]
              }
            ]
          }
        }
      },
      {
        $addFields: {
          winrate: {
            $divide: ['$rawWinrate', 100]
          }
        }
      },
      {
        $project: {
          username: 1,
          isPremium: 1,
          totalTrades: '$closedTrades',
          rawWinrate: 1,
          winrate: { $multiply: ['$winrate', 100] },
          totalGain: { $round: ['$totalGain', 2] },
          riskRewardRatio: { $round: [{ $ifNull: ['$riskRewardRatio', 0] }, 2] }
        }
      },
      {
        $sort: {
          totalGain: -1
        }
      }
    ]);

    // Log winrates for each user
    users.forEach(user => {
      console.log(`${user.username} - Raw Winrate: ${user.rawWinrate}%, Adjusted Winrate: ${user.winrate}%`);
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard data' });
  }
};
