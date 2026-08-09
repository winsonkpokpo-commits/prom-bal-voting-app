# Application de Vote - Bal Masqué 🎭

L'application complète a été générée dans le répertoire `C:\Users\HP\.gemini\antigravity\scratch\prom-voting-app`.

## Architecture Implémentée

### 1. Base de données (Supabase)
Le fichier `supabase-init.sql` contient le schéma complet avec **Row Level Security (RLS)** activée. 
Les tables générées sont : `config`, `students`, `categories` et `ballots`.
Aucun client ne peut y accéder directement : tout accès public non-serveur est bloqué.

### 2. Back-End (API Routes Astro SSR)
Toutes les interactions avec Supabase se font côté serveur via la clé `SUPABASE_SERVICE_ROLE_KEY`.
- `/api/vote` : Upsert sécurisé (un seul vote par élève).
- `/api/results` : Dépouillement et calcul des statistiques.
- `/api/admin/*` : Routes protégées par token (fermer/ouvrir/reset, gestion étudiants/catégories).

### 3. Front-End (Vanilla JS + CSS natif)
- **Thème Visuel** : Noir profond, or (`#d4af37`), composants `GlassCard.astro` avec effet blur (glassmorphism).
- **Polices** : *Cinzel* (titres) et *Work Sans* (texte).
- **Vues** :
  - `Voter` (`/`) : Sélection du profil, votes pour Roi/Reine et catégories dynamiques. Formulaire géré en Ajax (fetch) avec try/catch.
  - `Admin Config` (`/admin`) : Authentification par code. Boutons de verrouillage, purge, ajout d'élèves/catégories.
  - `Admin Résultats` (`/admin/results`) : Affichage des podiums et barres de progression proportionnelles animées.

## Instructions pour Lancer l'App

Puisque `npm` n'est pas installé sur votre environnement actuel, vous devrez installer **Node.js** avant de pouvoir démarrer le serveur.

Une fois Node.js installé, ouvrez un terminal dans `C:\Users\HP\.gemini\antigravity\scratch\prom-voting-app` et lancez :

```bash
npm install
npm run dev
```

> [!WARNING]
> N'oubliez pas de configurer vos variables d'environnement dans un fichier `.env` à la racine de l'application :
> `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `ADMIN_SECRET_KEY` (voir `.env.example`).
