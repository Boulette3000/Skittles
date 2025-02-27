// routes/articles.js
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { calculerPrix } = require('../server'); // Importation de la fonction calculerPrix

// Route pour afficher tous les articles
router.get('/', async (req, res) => {
    try {
        const articles = await Article.find();
        res.render('/', { articles });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});


// Ajouter un article
router.post('/ajout', async (req, res) => {
    try {
        const { article, qteArticle, intensite, description } = req.body;
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), 'spécifique', true);
        
        const nouvelArticle = new Article({
            article,
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description,
            prix
        });
        
        await nouvelArticle.save();
        res.redirect('/');
    } catch (err) {
        console.error('Erreur lors de l\'ajout:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Supprimer un article
router.post('/supprimer/:id', async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});


router.post('/videPannier', async (req, res) => {
    try {
        await Article.deleteMany({});
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }   
});

// Ajouter des articles prédéfinis - Skittle rouge
router.post('/init/red', async (req, res) => {
    try {
        const { qteArticle, intensite } = req.body;
        const prix = calculerPrix('Skittle rouge', parseInt(qteArticle), parseInt(intensite), 'rouge', false);
        
        const predefinedArticle = {
            article: 'Skittle rouge',
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description: 'Skittles goût Fraise',
            prix
        };

        await Article.create(predefinedArticle);
        res.redirect('/');
    } catch (err) {
        console.error('Erreur lors de l\'ajout:', err);
        res.status(500).send('Erreur serveur');
    }
});

// Ajouter des articles prédéfinis - Skittle vert
router.post('/init/green', async (req, res) => {
    try {
        const { qteArticle, intensite } = req.body;
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

// Ajouter des articles prédéfinis - Skittle violet
router.post('/init/purple', async (req, res) => {
    try {
        const { qteArticle, intensite } = req.body;
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
module.exports = router;




