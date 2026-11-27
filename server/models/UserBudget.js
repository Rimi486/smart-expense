const { Schema, model } = require('mongoose');

// category = 'Overall' holds the total monthly budget; any other value is a category limit.
const budgetSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true, min: 1 },
});
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

// Separate collection name so it never clashes with the older single-user budgets.
module.exports = model('UserBudget', budgetSchema, 'user_budgets');
