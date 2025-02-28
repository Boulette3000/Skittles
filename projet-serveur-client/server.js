// Chargement des variables d'environnement depuis un fichier .env que vous devez créer dans le dossier de votre projet et y placer le lien (appelé MONGO_URI ici) vers votre base de donnée
// Cette approche est essentielle pour la sécurité car elle évite de stocker des informations sensibles directement dans le code
require('dotenv').config();

// Importation des modules nécessaires
const express = require('express');       // Framework pour créer le serveur web et gérer les routes HTTP
const mongoose = require('mongoose');    // ORM (Object-Relational Mapping) pour MongoDB - facilite les interactions avec la base de données
const path = require('path');            // Module natif de Node.js pour manipuler les chemins de fichiers de façon compatible avec tous les OS
const http = require('http');            // Module natif de Node.js pour créer un serveur HTTP
const socketIo = require('socket.io');   // Bibliothèque pour créer des communications bidirectionnelles en temps réel via WebSockets
const session = require('express-session'); // Middleware pour gérer les sessions utilisateurs et stocker des données entre les requêtes
const Article = require('./models/Article'); // Import du modèle Article défini dans le dossier models

// Création de l'application Express - c'est l'objet principal qui représente notre serveur web
const app = express();

// ---- Configuration des middlewares ----
// Les middlewares sont des fonctions qui s'exécutent entre la réception d'une requête et l'envoi d'une réponse

// Middleware pour analyser les données des requêtes POST
app.use(express.urlencoded({ extended: true })); // Analyse les données des formulaires HTML (format x-www-form-urlencoded)
app.use(express.json()); // Analyse les données au format JSON dans le corps des requêtes

// Middleware pour servir des fichiers statiques (CSS, JS, images, etc.)
// Tous les fichiers dans le dossier 'public' seront accessibles directement par le navigateur
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de rendu pour générer des pages HTML dynamiques
app.set('view engine', 'ejs'); // Utilisation de EJS (Embedded JavaScript) comme moteur de template
app.set('views', __dirname + '/views'); // Définit le dossier où sont stockés les templates EJS

// Configuration du middleware de session
// Les sessions permettent de stocker des données utilisateur côté serveur entre les différentes requêtes
app.use(session({
    secret: 'votre_secret_de_session', // Chaîne utilisée pour signer le cookie de session - ATTENTION: à changer en production!
    resave: false,                     // Ne pas sauvegarder la session si elle n'a pas été modifiée
    saveUninitialized: true,           // Sauvegarder les sessions non initialisées
    cookie: { secure: false }          // Cookies non-sécurisés (HTTP) - à mettre à true en production avec HTTPS
}));

// Connexion à la base de données MongoDB Atlas (version cloud de MongoDB)
// Les options useNewUrlParser et useUnifiedTopology sont recommandées pour éviter les avertissements de dépréciation
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Atlas connecté')) // Promesse résolue - connexion réussie
    .catch(err => console.log('Erreur de connexion MongoDB:', err)); // Gestion des erreurs de connexion

// ---- Fonction utilitaire pour le calcul des prix ----
// Cette fonction détermine le prix final d'un article selon plusieurs critères
function calculerPrix(article, qteArticle, intensite, couleur, specifique) {
    let prixBase = 10.69; // Prix de base par Skittle (en euros probablement)
    let prixIntensite = intensite * 0.9; // Prix supplémentaire basé sur l'intensité (0.9€ par unité d'intensité)
    let prixCouleur = 0; // Prix initial pour la couleur
    
    // Structure switch pour attribuer un prix différent selon la couleur choisie
    switch (couleur) {
        case 'rouge':
            prixCouleur = 1; // +1€ pour la couleur rouge
            break;
        case 'vert':
            prixCouleur = 1.5; // +1.5€ pour la couleur verte
            break;
        case 'violet':
            prixCouleur = 3; // +3€ pour la couleur violette (la plus chère)
            break;
        default:
            prixCouleur = 0.1; // +0.1€ pour toute autre couleur non listée
            break;
    }

    let prixSpecifique = specifique ? 50 : 0; // +50€ si l'option "spécifique" est activée (true)
    
    // Calcul du prix total: (prix de base + prix d'intensité + prix de couleur + supplément spécifique) * quantité
    // toFixed(2) formate le nombre avec 2 décimales, puis Number() reconvertit le résultat en nombre
    return Number(((prixBase + prixIntensite + prixCouleur + prixSpecifique) * qteArticle).toFixed(2));
}

// Export de la fonction calculerPrix pour pouvoir l'utiliser dans d'autres fichiers
module.exports.calculerPrix = calculerPrix;

// ---- Configuration des routes ----
// Les routes liées aux articles sont définies dans le fichier ./routes/articles
// Cette approche modularise le code en séparant les routes dans différents fichiers
app.use('/articles', require('./routes/articles'));

// Code commenté - ancienne version de la route d'accueil qui utilisait les sessions pour stocker le panier
// app.get('/', (req, res) => {
//     const articles = req.session.articles || [];
//     let totalPrix = articles.reduce((total, article) => total + article.prix, 0);
//     res.render('index', { articles, totalPrix });
// });

// Définition de la route de la page d'accueil (nouvelle version qui utilise MongoDB)
app.get('/', async (req, res) => {
    try {
        // Récupérer tous les articles du panier depuis la base de données avec la méthode find() de Mongoose
        // Notez l'utilisation de async/await pour gérer les opérations asynchrones de manière plus lisible
        const articles = await Article.find({});
        
        // Calculer le prix total en utilisant la méthode reduce() qui accumule les valeurs d'un tableau
        // toFixed(2) garantit 2 décimales pour éviter les erreurs d'arrondi avec les nombres flottants
        const totalPrix = Number(articles.reduce((sum, article) => sum + article.prix, 0).toFixed(2));
        
        // Rendre la page index.ejs avec les données articles et totalPrix
        res.render('index', {
            articles: articles, // Les articles trouvés dans la base de données
            totalPrix: totalPrix // Le prix total calculé
        });
    } catch (error) {
        // Gestion des erreurs - si une erreur se produit lors de la récupération des articles
        console.error('Erreur lors de la récupération des articles:', error);
        // On rend quand même la page mais avec un panier vide et un prix à 0
        res.render('index', {
            articles: [],
            totalPrix: 0
        });
    }
});


// Route pour ajouter un article personnalisé au panier (via POST /ajout)
app.post('/ajout', async (req, res) => {
    try {
        // Extraction des données du formulaire depuis req.body
        const { article, qteArticle, intensite, description } = req.body;
        // Pour les articles personnalisés, on utilise toujours la couleur 'spécifique'
        const couleur = 'spécifique';
        // Calcul du prix avec l'option spécifique à true (+50€)
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), couleur, true);
        
        // Création d'une nouvelle instance du modèle Article
        const nouvelArticle = new Article({
            article,                      // Nom de l'article
            qteArticle: parseInt(qteArticle), // Quantité (convertie en nombre)
            intensite: parseInt(intensite),   // Intensité (convertie en nombre)
            description,                  // Description de l'article
            prix                         // Prix calculé
        });
        
        // Sauvegarde de l'article dans la base de données
        await nouvelArticle.save();
        // Redirection vers la page d'accueil pour voir le panier mis à jour
        res.redirect('/');
    } catch (error) {
        // Gestion des erreurs lors de l'ajout de l'article
        console.error('Erreur lors de l\'ajout:', error);
        res.redirect('/'); // On redirige quand même vers l'accueil en cas d'erreur
    }
});

// Route pour ajouter un article prédéfini au panier (via POST /init/:couleur)
// :couleur est un paramètre dynamique dans l'URL, comme /init/rouge ou /init/vert
app.post('/init/:couleur', async (req, res) => {
    try {
        // Récupération de la couleur depuis les paramètres de l'URL
        const { couleur } = req.params;
        // Récupération de la quantité et de l'intensité depuis le corps de la requête
        const { qteArticle, intensite } = req.body;
        // Construction du nom de l'article standard (ex: "Skittle rouge")
        const article = `Skittle ${couleur}`;
        // Construction de la description standard avec la couleur et l'intensité
        const description = `Skittle ${couleur} avec intensité ${intensite} mg`;
        // Calcul du prix pour un article standard (option spécifique à false)
        const prix = calculerPrix(article, parseInt(qteArticle), parseInt(intensite), couleur, false);
        
        // Création d'une nouvelle instance du modèle Article
        const nouvelArticle = new Article({
            article,
            qteArticle: parseInt(qteArticle),
            intensite: parseInt(intensite),
            description,
            prix
        });
        
        // Sauvegarde dans la base de données et redirection
        await nouvelArticle.save();
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        res.redirect('/');
    }
});

// Route pour afficher la page de paiement (via GET /paiement)
app.get('/paiement', (req, res) => {
    // Rend simplement la vue paiement.ejs sans données supplémentaires
    res.render('paiement');
});

// Route pour valider le paiement et rediriger vers le récapitulatif (via POST /paiement/valider)
app.post('/paiement/valider', async (req, res) => {
    // Génération d'un numéro de suivi aléatoire entre 0 et 999,999,999
    const trackingNumber = Math.floor(Math.random() * 1000000000);
    
    // Récupération des articles depuis la base de données (mais non utilisés dans cette route)
    // Note: cette ligne pourrait être supprimée car les articles ne sont pas utilisés ici
    const articles = await Article.find({});
    
    // Redirection vers la page de récapitulatif avec le numéro de suivi comme paramètre d'URL
    res.redirect(`/recapitulatif?trackingNumber=${trackingNumber}`);
});

// Route pour afficher la page de récapitulatif de commande (via GET /recapitulatif)
app.get('/recapitulatif', async (req, res) => {
    try {
        // Récupération du numéro de suivi depuis les paramètres de la requête
        const trackingNumber = req.query.trackingNumber;
        // Récupération de tous les articles depuis la base de données
        const articles = await Article.find({});
        
        // Rendu de la page récapitulatif.ejs avec le numéro de suivi et les articles
        res.render('recapitulatif', { 
            trackingNumber, 
            articles 
        });
    } catch (error) {
        // Gestion des erreurs lors de la récupération des articles
        console.error('Erreur lors de la récupération des articles:', error);
        // Rendu de la page avec le numéro de suivi mais un tableau d'articles vide
        res.render('recapitulatif', { 
            trackingNumber: req.query.trackingNumber, 
            articles: [] 
        });
    }
});

// Route pour vider le panier et rediriger vers la page principale (via POST /viderPanier)
// Cette route utilise encore l'ancien système de panier basé sur les sessions, ce qui est incohérent
// avec le reste du code qui utilise maintenant MongoDB
app.post('/viderPanier', (req, res) => {
    req.session.articles = []; // Vider le panier dans la session
    res.redirect('/');        // Rediriger vers la page d'accueil
});

// Route pour vider le panier et rediriger vers la page des articles (via POST /viderPanierEtRetour)
// Cette route utilise correctement l'approche MongoDB
app.post('/viderPanierEtRetour', async (req, res) => {
    try {
        // Supprimer tous les articles de la base de données avec la méthode deleteMany()
        await Article.deleteMany({});
        res.redirect('/'); // Rediriger vers la page d'accueil
    } catch (error) {
        // Gestion des erreurs lors de la suppression
        console.error('Erreur lors du vidage du panier:', error);
        res.redirect('/'); // Redirection même en cas d'erreur
    }
});

// ---- Configuration du serveur et de Socket.io ----
// Définition du port sur lequel le serveur va écouter (variable d'environnement ou 3000 par défaut)
const PORT = process.env.PORT || 3000;

// Création du serveur HTTP basé sur notre application Express
const server = http.createServer(app);

// Configuration de Socket.io sur notre serveur HTTP
// Socket.io permet la communication bidirectionnelle en temps réel entre le serveur et les clients
const io = socketIo(server);

// Gestion des événements Socket.io
io.on('connection', (socket) => {
    // Événement déclenché quand un client se connecte
    console.log('Un utilisateur s\'est connecté');

    // Gestion de l'événement 'message' envoyé par un client
    socket.on('message', (msg) => {
        console.log('Message reçu :', msg);
        io.emit('message', msg); // Émet le message à tous les clients connectés (broadcast)
    });

    // Événement déclenché quand un client se déconnecte
    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
    });
});

// Démarrage du serveur sur le port spécifié
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});