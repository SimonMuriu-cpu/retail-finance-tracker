const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'sales',
      'utilities',
      'rent',
      'inventory',
      'marketing',
      'payroll',
      'maintenance',
      'other'
    ],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  receipt: {
    url: String,
    key: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  ocrData: {
    vendor: String,
    invoiceNumber: String,
    items: [{
      description: String,
      quantity: Number,
      price: Number
    }],
    total: Number,
    tax: Number,
    date: Date
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for common queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Method to get transaction summary
transactionSchema.statics.getSummary = async function(userId) {
  const summary = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        total: { $sum: '$amount' }
      }
    }
  ]);

  return summary;
};

// Method to get transactions by date range
transactionSchema.statics.getByDateRange = async function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Method to get category totals
transactionSchema.statics.getCategoryTotals = async function(userId) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Virtual for formatted date
transactionSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to calculate total with tax
transactionSchema.methods.getTotalWithTax = function() {
  return this.amount + (this.ocrData?.tax || 0);
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 