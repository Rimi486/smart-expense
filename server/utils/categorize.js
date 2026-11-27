// Keyword-based auto-categorisation. Extend the lists to fit your own spending.
const RULES = {
  Food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'biryani', 'grocery', 'groceries', 'bigbasket', 'blinkit', 'zepto', 'snacks'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'mall', 'shirt', 'electronics'],
  Transportation: ['uber', 'ola', 'rapido', 'metro', 'bus', 'fuel', 'petrol', 'diesel', 'cab', 'taxi', 'train', 'irctc', 'parking', 'toll', 'flight'],
  Education: ['course', 'udemy', 'book', 'books', 'tuition', 'exam', 'fees', 'college'],
  Entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'prime', 'hotstar', 'game', 'concert'],
  Healthcare: ['pharmacy', 'medicine', 'doctor', 'hospital', 'clinic', 'gym', 'lab test', 'apollo'],
  Bills: ['electricity', 'rent', 'wifi', 'internet', 'broadband', 'recharge', 'water bill', 'gas', 'insurance', 'emi', 'jio', 'airtel'],
};

const CATEGORIES = [...Object.keys(RULES), 'Others'];

function guessCategory(text = '') {
  const t = String(text || '').toLowerCase();
  for (const [category, words] of Object.entries(RULES)) {
    if (words.some((w) => t.includes(w))) return category;
  }
  return 'Others';
}

module.exports = { guessCategory, CATEGORIES };
