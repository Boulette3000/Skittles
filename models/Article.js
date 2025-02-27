// models/Article.js
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
    article: { type: String, required: true },
    qteArticle: { type: Number, required: true },
    intensite: { type: Number, required: true },
    description: { type: String, required: true },
    prix: { type: Number, required: true },
    dateCreation: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', ArticleSchema);

