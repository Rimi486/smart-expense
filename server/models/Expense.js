const { Schema, model } = require('mongoose');

// One collection holds income, expenses and investments (the `type` field tells them apart).
const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense', 'investment'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 }, // expense title or income source
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now, index: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    autoCategorized: { type: Boolean, default: false },
    unusual: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model('Expense', transactionSchema);
