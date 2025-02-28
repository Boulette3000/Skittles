// models/Article.js

// Importation de la bibliothèque Mongoose pour interagir avec MongoDB
// Mongoose est un ODM (Object Data Modeling) qui fournit une solution basée sur des schémas 
// pour modéliser les données de notre application
const mongoose = require('mongoose');

// Définition du schéma pour les articles
// Un schéma Mongoose définit la structure du document, les validateurs par défaut,
// et les valeurs par défaut pour les documents créés
const ArticleSchema = new mongoose.Schema({
    // Nom de l'article - chaîne de caractères obligatoire
    // required: true signifie que ce champ doit être fourni lors de la création
    article: { type: String, required: true },
    
    // Quantité d'articles - nombre entier obligatoire
    // Ce champ stocke combien d'unités de cet article ont été commandées
    qteArticle: { type: Number, required: true },
    
    // Intensité de l'article - nombre entier obligatoire
    // Cela semble être spécifique au domaine de l'application, 
    // peut-être pour des produits comme des épices, du café, ou des bonbons
    intensite: { type: Number, required: true },
    
    // Description de l'article - chaîne de caractères obligatoire
    // Contient des informations supplémentaires sur l'article
    description: { type: String, required: true },
    
    // Prix de l'article - nombre obligatoire
    // Représente le coût de l'article, probablement calculé en fonction
    // de la quantité et de l'intensité selon la fonction calculerPrix importée dans les routes
    prix: { type: Number, required: true },
    
    // Date de création de l'entrée - type Date avec valeur par défaut
    // default: Date.now définit automatiquement la date/heure actuelle 
    // si aucune valeur n'est spécifiée lors de la création
    dateCreation: { type: Date, default: Date.now },
});

// Création et exportation du modèle 'Article' basé sur le schéma défini
// Le premier argument 'Article' sera le nom de la collection dans MongoDB (transformé en 'articles')
// Le second argument est le schéma qui définit la structure des documents
module.exports = mongoose.model('Article', ArticleSchema);