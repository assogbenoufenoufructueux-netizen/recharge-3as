# 1XBET Easy Top-Up

Créer une application mobile Android et iOS nommée "3AS Recharge 1XBET" permettant aux clients d'effectuer eux-mêmes des demandes de recharge et de retrait de l'application vers leur compte 1XBET, avec validation manuelle par l'agent.

Fonctionnalités principales :

Espace Client

 3ASRecharge 

 Code Promo: FENOU229

Inscription et connexion avec numéro de téléphone.

Tableau de bord simple et moderne.

Formulaire de recharge :

ID 1XBET du client.

Montant à recharger.

Moyen de paiement (MTN MoMo, Celtiis Cash, Moov Money, etc.).

Téléversement de la preuve de paiement (ID du translation).

Historique des demandes.

Notification du statut :

En attente.

Validée.

Rejetée.

Espace Agent (Administrateur)

Connexion sécurisée.

Liste de toutes les demandes de recharge.

Affichage des informations du client :

Nom.

Numéro de téléphone.

ID 1XBET.

Montant.

ID du translation.

Boutons :

Valider la recharge.

Rejeter la recharge.

Ajout d'un commentaire lors du rejet.

Notifications automatiques au client après validation ou rejet.

Gestion financière

Affichage des numéros de paiement de l'agent.

Calcul automatique des montants reçus.

Historique des opérations validées.

Statistiques journalières, hebdomadaires et mensuelles.

Design

Interface professionnelle.

Couleurs dominantes : bleu et blanc.

Inspirée du style moderne de 1XBET.

Utilisation d'icônes simples et intuitives.

Compatible avec les téléphones Android de faible puissance.

Sécurité

Vérification des numéros de téléphone par code OTP.

Protection des données utilisateurs.

Journalisation de toutes les actions administrateur.

Technologies recommandées

Frontend : Flutter.

Backend : Firebase ou Laravel API.

Base de données : Firebase Firestore ou MySQL.

Notifications : Firebase Cloud Messaging.

Objectif :Permettre aux clients de soumettre leurs demandes de dépôt et retrait 1XBET de manière autonome à partir de l'application, tandis que l'agent contrôle et valide manuellement chaque opération avant que la recharge ne soit considérée comme terminée.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://recharge-3as.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/379ff65a-bdda-46d5-a681-19b11ec59477).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
