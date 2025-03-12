// utils/gamification.js
const User = require('../models/User');

// Level thresholds configuration
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4000, 6000, 8500, 11500, 15000, 20000];

/**
 * Update a user's XP and check for level up
 * @param {string} userId - The user's ID
 * @param {number} xpAmount - The amount of XP to add
 * @param {string} action - The action that earned the XP (for logging)
 * @returns {Promise<Object>} - XP update information
 */
async function updateUserXP(userId, xpAmount, action) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const oldLevel = user.level;
    user.xp += xpAmount;

    // Check if user leveled up
    let newLevel = oldLevel;
    for (let i = oldLevel; i < LEVEL_THRESHOLDS.length; i++) {
      if (user.xp >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }

    user.level = newLevel;
    await user.save();

    console.log(`✅ User ${user.username} earned ${xpAmount} XP for ${action}. New XP: ${user.xp}, Level: ${user.level}`);

    return {
      xp: user.xp,
      level: user.level,
      leveledUp: newLevel > oldLevel,
      xpGained: xpAmount
    };
  } catch (error) {
    console.error("❌ Error updating XP:", error);
    return null;
  }
}

module.exports = {
  updateUserXP,
  LEVEL_THRESHOLDS
};
