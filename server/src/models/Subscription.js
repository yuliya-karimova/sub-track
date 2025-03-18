const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
