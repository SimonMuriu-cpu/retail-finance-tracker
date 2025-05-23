const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const { createWorker } = require('tesseract.js');
const { auth, checkRole } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const { processReceipt } = require('../services/ocr');

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

// Configure multer for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize Tesseract worker
const worker = createWorker();

// Create new transaction
router.post('/', auth, [
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0 }),
  body('description').trim().notEmpty(),
  body('category').isIn([
    'sales',
    'utilities',
    'rent',
    'inventory',
    'marketing',
    'payroll',
    'maintenance',
    'other'
  ])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const transaction = new Transaction({
      ...req.body,
      user: req.user._id
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
});

// Upload receipt and process with OCR
router.post('/upload-receipt', auth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to S3
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `receipts/${req.user.id}/${fileName}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    const s3Response = await s3.upload(s3Params).promise();

    // Process receipt with OCR
    const ocrData = await processReceipt(req.file.buffer);

    // Create transaction with OCR data
    const transaction = new Transaction({
      user: req.user.id,
      type: 'expense',
      amount: ocrData.total,
      description: ocrData.vendor,
      category: 'other',
      date: ocrData.date || new Date(),
      receipt: {
        url: s3Response.Location,
        key: s3Response.Key
      }
    });

    await transaction.save();

    res.json({
      transaction,
      ocrData
    });
  } catch (err) {
    console.error('Receipt processing error:', err);
    res.status(500).json({ message: 'Error processing receipt' });
  }
});

// Get all transactions for user
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get transaction summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const categorySummary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      summary,
      categorySummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching summary',
      error: error.message
    });
  }
});

// Update a transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.type = type;
    transaction.amount = amount;
    transaction.description = description;
    transaction.category = category;
    transaction.date = date;

    await transaction.save();
    res.json({ transaction });
  } catch (err) {
    res.status(400).json({ message: 'Error updating transaction' });
  }
});

// Delete a transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Delete receipt from S3 if exists
    if (transaction.receipt && transaction.receipt.key) {
      await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: transaction.receipt.key
      }).promise();
    }

    await transaction.remove();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          user: req.user.id
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

    const summary = {
      income: 0,
      expenses: 0,
      byCategory: {}
    };

    stats.forEach(stat => {
      if (stat._id.type === 'income') {
        summary.income += stat.total;
      } else {
        summary.expenses += stat.total;
        summary.byCategory[stat._id.category] = (summary.byCategory[stat._id.category] || 0) + stat.total;
      }
    });

    summary.netProfit = summary.income - summary.expenses;

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transaction statistics' });
  }
});

// Helper functions for OCR text parsing
function extractVendor(text) {
  // Implement vendor extraction logic
  return '';
}

function extractTotal(text) {
  // Implement total amount extraction logic
  return 0;
}

function extractDate(text) {
  // Implement date extraction logic
  return new Date();
}

function extractItems(text) {
  // Implement items extraction logic
  return [];
}

module.exports = router; 