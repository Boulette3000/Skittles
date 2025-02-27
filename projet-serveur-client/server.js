// Chargement des variables d'environnement depuis un fichier .env que vous devez créer dans le dossier de votre projet et y placer le lien (appelé MONGO_URI ici) vers votre base de donnée
require('dotenv').config();

// Importation des modules nécessaires
const express = require('express');       // Framework pour créer le serveur
const mongoose = require('mongoose');    // Librairie pour interagir avec la base de donnée MongoDB
const path = require('path');            // Module pour manipuler les chemins des fichiers
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session'); // Middleware de session
const Article = require('./models/Article');

// Création de l'application Express
const app = express();

// Middleware pour analyser les données des requêtes POST
app.use(express.urlencoded({ extended: true })); // Analyse les données des formulaires
app.use(express.json()); // Analyse les données JSON

// Middleware pour servir des fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de rendu pour générer des pages HTML dynamiques
app.set('view engine', 'ejs'); // Utilisation de EJS comme moteur de rendu
app.set('views', __dirname + '/views');

// Configuration du middleware de session
app.use(session({
    secret: 'votre_secret_de_session', // Remplacez par une chaîne secrète pour signer le cookie de session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Utilisez secure: true si vous utilisez HTTPS
}));

// Connexion à la base de données MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Atlas connecté')) // Succès de la connexion
    .catch(err => console.log('Erreur de connexion MongoDB:', err)); // Gestion des erreurs

// Fonction pour calculer le prix des articles
function calculerPrix(article, qteArticle, intensite, couleur, specifique) {
    let prixBase = 10.69; // Prix de base par Skittle
    let prixIntensite = intensite * 0.9; // Prix par mg d'intensité
    let prixCouleur = 0;

    switch (couleur) {
        case 'rouge':
            prixCouleur = 1;
            break;
        case 'vert':
            prixCouleur = 1.5;
            break;
        case 'violet':
            prixCouleur = 3;
            break;
        default:
            prixCouleur = 0.1;
            break;
    }

    let prixSpecifique = specifique ? 50 : 0; // Supplément pour demande spécifique

    return Number(((prixBase + prixIntensite + prixCouleur + prixSpecifique) * qteArticle).toFixed(2));
}

module.exports.calculerPrix = calculerPrix;
// Définition des routes
// Les routes liées aux articles sont définies dans le fichier ./routes/articles
app.use('/articles', require('./routes/articles'));

// Définition de la route de la page d'accueil
// app.get('/', (req, res) => {
//     const articles = req.session.articles || [];
//     let totalPrix = articles.reduce((total, article) => total + article.prix, 0);
//     res.render('index', { articles, totalPrix });
// });

app.get('/', async (req, res) => {
    try {
        // Récupérer tous les articles du panier depuis la base de données
        const articles = await Article.find({});
        
        // Calculer le prix total
        const totalPrix = Number(articles.reduce((sum, article) => sum + article.prix, 0).toFixed(2));
        
        // Rendre la page avec les données
        res.render('index', {
            articles: articles,
            totalPrix: totalPrix
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.render('index', {
            articles: [],
            totalPrix: 0
        });
    }
});


// Route pour ajouter un article au panier
app.post('/ajout', async (req, res) => {
    try {
        const { article, qteArticle, intensite, description } = req.body;
        const couleur = 'spécifique';
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), couleur, true);
        
        const nouvelArticle = new Article({
            article,
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description,
            prix
        });
        
        await nouvelArticle.save();
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        res.redirect('/');
    }
});

// Route pour ajouter un article prédéfini au panier
app.post('/init/:couleur', async (req, res) => {
    try {
        const { couleur } = req.params;
        const { qteArticle, intensite } = req.body;
        const article = `Skittle ${couleur}`;
        const description = `Skittle ${couleur} avec intensité ${intensite} mg`;
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), couleur, false);
        
        const nouvelArticle = new Article({
            article,
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description,
            prix
        });
        
        await nouvelArticle.save();
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        res.redirect('/');
    }
});

// Route pour la page de paiement
app.get('/paiement', (req, res) => {
    res.render('paiement');
});

// Route pour valider le paiement et rediriger vers le récapitulatif de commande
app.post('/paiement/valider', async (req, res) => {
    const trackingNumber = Math.floor(Math.random() * 1000000000);
    // Récupérer les articles depuis la base de données
    const articles = await Article.find({});
    res.redirect(`/recapitulatif?trackingNumber=${trackingNumber}`);
});

// Route pour la page de récapitulatif de commande
app.get('/recapitulatif', async (req, res) => {
    try {
        const trackingNumber = req.query.trackingNumber;
        // Récupérer les articles depuis la base de données
        const articles = await Article.find({});
        res.render('recapitulatif', { 
            trackingNumber, 
            articles 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.render('recapitulatif', { 
            trackingNumber: req.query.trackingNumber, 
            articles: [] 
        });
    }
});

// Route pour vider le panier et rediriger vers la page principale
app.post('/viderPanier', (req, res) => {
    req.session.articles = []; // Vider le panier
    res.redirect('/');
});

// Route pour vider le panier et rediriger vers la page des articles
app.post('/viderPanierEtRetour', async (req, res) => {
    try {
        // Supprimer tous les articles de la base de données
        await Article.deleteMany({});
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors du vidage du panier:', error);
        res.redirect('/');
    }
});

// Démarrage du serveur sur un port spécifique
const PORT = process.env.PORT || 3000; // Le port est défini dans le fichier .env ou par défaut à 3000

// Création du serveur HTTP et configuration de Socket.io
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('message', (msg) => {
        console.log('Message reçu :', msg);
        io.emit('message', msg); // Répète le message à tous les clients connectés
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});