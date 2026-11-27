const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // bcrypt hash, never returned by default
    currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
