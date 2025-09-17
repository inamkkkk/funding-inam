const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  goalAmount: {
    type: Number,
    required: true
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['technology', 'education', 'health', 'community', 'arts'],
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'successful', 'failed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);