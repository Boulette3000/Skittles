// routes/articles.js
const express = require('express'); // Importation du framework Express
const router = express.Router(); // Création d'un routeur Express pour organiser les routes
const Article = require('../models/Article'); // Importation du modèle Article (schéma MongoDB)
const { calculerPrix } = require('../server'); // Importation de la fonction calculerPrix depuis server.js

// Route GET pour afficher tous les articles
// Cette route répond aux requêtes HTTP GET sur le chemin '/'
router.get('/', async (req, res) => {
    try {
        // Utilisation de la méthode find() du modèle Article pour récupérer tous les articles de la base de données
        // L'opération est asynchrone, d'où l'utilisation de async/await
        const articles = await Article.find();
        
        // Rendu de la vue avec les articles récupérés
        // Le deuxième paramètre passe les données à la vue (template EJS)
        res.render('/', { articles });
    } catch (err) {
        // Gestion des erreurs : si une exception est levée, retourne un code 500 (erreur serveur)
        res.status(500).send('Erreur serveur');
    }
});


// Route POST pour ajouter un nouvel article
// Cette route répond aux requêtes HTTP POST sur le chemin '/ajout'
router.post('/ajout', async (req, res) => {
    try {
        // Destructuration pour extraire les données du corps de la requête (req.body)
        const { article, qteArticle, intensite, description } = req.body;
        
        // Calcul du prix en utilisant la fonction importée
        // Les valeurs sont converties en entiers avec parseInt pour s'assurer qu'elles sont numériques
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), 'spécifique', true);
        
        // Création d'une nouvelle instance du modèle Article avec les données
        const nouvelArticle = new Article({
            article,
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description,
            prix
        });
        
        // Sauvegarde de l'article dans la base de données
        // L'opération est asynchrone, d'où l'utilisation de await
        await nouvelArticle.save();
        
        // Redirection vers la page d'accueil après l'ajout
        res.redirect('/');
    } catch (err) {
        // Affichage détaillé de l'erreur dans la console pour faciliter le débogage
        console.error('Erreur lors de l\'ajout:', err);
        
        // Réponse avec code d'erreur 500 à l'utilisateur
        res.status(500).send('Erreur serveur');
    }
});

// Route POST pour supprimer un article
// Cette route utilise un paramètre d'URL ':id' pour identifier l'article à supprimer
router.post('/supprimer/:id', async (req, res) => {
    try {
        // Utilisation de la méthode findByIdAndDelete de Mongoose pour supprimer l'article
        // req.params.id récupère l'identifiant passé dans l'URL
        await Article.findByIdAndDelete(req.params.id);
        
        // Redirection vers la page d'accueil après la suppression
        res.redirect('/');
    } catch (err) {
        // En cas d'erreur, renvoie un code 500
        res.status(500).send('Erreur serveur');
    }
});


// Route POST pour vider le panier (supprimer tous les articles)
// Note: il y a une faute d'orthographe dans le nom de la route ('videPannier' au lieu de 'videPanier')
router.post('/videPannier', async (req, res) => {
    try {
        // Utilisation de la méthode deleteMany avec un objet vide {} comme filtre
        // Cela correspond à tous les documents, donc supprime tous les articles
        await Article.deleteMany({});
        
        // Redirection vers la page d'accueil après avoir vidé le panier
        res.redirect('/');
    } catch (err) {
        // Gestion des erreurs
        res.status(500).send('Erreur serveur');
    }   
});

// Route POST pour ajouter un article prédéfini - Skittle rouge
router.post('/init/red', async (req, res) => {
    try {
        // Récupération des valeurs de quantité et intensité depuis le corps de la requête
        const { qteArticle, intensite } = req.body;
        
        // Calcul du prix en utilisant des paramètres spécifiques pour le Skittle rouge
        // Le dernier paramètre 'false' est probablement lié à une option de tarification
        const prix = calculerPrix('Skittle rouge', parseInt(qteArticle), parseInt(intensite), 'rouge', false);
        
        // Création d'un objet avec les propriétés de l'article prédéfini
        const predefinedArticle = {
            article: 'Skittle rouge',
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description: 'Skittles goût Fraise',
            prix
        };

        // Utilisation de la méthode create() pour créer et sauvegarder l'article en une seule opération
        // C'est une alternative à new Article() + save()
        await Article.create(predefinedArticle);
        
        // Redirection vers la page d'accueil
        res.redirect('/');
    } catch (err) {
        // Affichage détaillé de l'erreur dans la console
        console.error('Erreur lors de l\'ajout:', err);
        
        // Réponse avec code d'erreur
        res.status(500).send('Erreur serveur');
    }
});

// Route POST pour ajouter un article prédéfini - Skittle vert
// Structure et fonctionnement identiques à la route pour Skittle rouge
router.post('/init/green', async (req, res) => {
    try {
        const { qteArticle, intensite } = req.body;
        // Notez le changement de paramètres pour le calcul du prix ('vert' au lieu de 'rouge')
        const prix = calculerPrix('Skittle vert', parseInt(qteArticle), parseInt(intensite), 'vert', false);
        
        const predefinedArticle = {
            article: 'Skittle vert',
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description: 'Skittles goût Pomme',
            prix
        };

        await Article.create(predefinedArticle);
        res.redirect('/');
    } catch (err) {
        console.error('Erreur lors de l\'ajout:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Route POST pour ajouter un article prédéfini - Skittle violet
// Structure et fonctionnement identiques aux routes précédentes
router.post('/init/purple', async (req, res) => {
    try {
        const { qteArticle, intensite } = req.body;
        // Paramètres spécifiques pour le Skittle violet
        const prix = calculerPrix('Skittle violet', parseInt(qteArticle), parseInt(intensite), 'violet', false);
        
        const predefinedArticle = {
            article: 'Skittle violet',
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description: 'Skittles goût Myrtille',
            prix
        };

        await Article.create(predefinedArticle);
        res.redirect('/');
    } catch (err) {
        console.error('Erreur lors de l\'ajout:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Exportation du routeur pour l'utiliser dans l'application principale
module.exports = router;