const Log = require('../models/logModel');

async function logEvent(module, message, type = 'INFO') {
  try {
    const newLog = new Log({
      module,
      message,
      type,
      timestamp: new Date()
    });
    await newLog.save();
  } catch (error) {
    console.error(`Failed to log event: ${error.message}`);
  }
}

module.exports = { logEvent };
