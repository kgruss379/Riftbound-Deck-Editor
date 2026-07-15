# Riftbound Deck Editor - Setup & Deployment Guide

This is a client-side-only React + JavaScript web application built with **Vite**, **React Router (v6)**, and **React Bootstrap**. It is designed to be hosted entirely on static site platforms like **GitHub Pages** without any server-side dependencies.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or higher is recommended).

### Local Setup
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/kgruss379/Riftbound-Deck-Editor.git
   cd Riftbound-Deck-Editor
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173/` (or the URL provided in your terminal) to view the application locally.

4. **Build for Production:**
   ```bash
   npm run build
   ```
   This generates a static bundle inside the `dist/` directory, ready to be hosted.

---

## 🛠️ Key Technologies & Configuration

### 1. Client-Side Routing (React Router)
Standard web servers route all non-file traffic to an `index.html` file (rewrites). Static hosts like GitHub Pages do not do this out of the box, leading to **404 Errors** when reloading pages like `/deck-editor`.

To prevent 404s, this project uses **Hash-Based Routing (`HashRouter`)** rather than standard browser history routing.
- **Routing Paradigm:** We use the modern declarative data router APIs (`createHashRouter` and `<RouterProvider>`).
- **Path structure:** URLs will look like `https://username.github.io/Riftbound-Deck-Editor/#/deck-editor`.
- **How it works:** The web server only requests the root `index.html` (before the `#`), and React Router handles everything after the hash entirely in the client browser.

### 2. Styling (React Bootstrap & Vanilla CSS)
- **Bootstrap CSS:** Imported globally in `src/main.jsx` (`import 'bootstrap/dist/css/bootstrap.min.css';`).
- **Components:** Built using declarative React Bootstrap elements (`<Container>`, `<Row>`, `<Col>`, `<Card>`, `<Navbar>`).
- **Custom Overrides:** Managed in `src/index.css` to add premium gaming themes (dark mode backgrounds, vibrant text glowing effects, glassmorphic card overlays) matching the *Riftbound TCG* League of Legends aesthetic.

### 3. Vite Config for GitHub Pages Subdirectories
GitHub Pages hosts project sites in subfolders (e.g., `https://username.github.io/repository-name/`). In `vite.config.js`, the `base` property is set to:
```javascript
base: './'
```
This forces all built assets (JS, CSS, images) to use relative URLs (e.g., `./assets/index.js`), ensuring they resolve correctly regardless of whether the site is hosted at the root domain or a subdirectory.

---

## 📦 GitHub Pages Deployment

We have configured automated deployment using the `gh-pages` npm utility.

### Step 1: Deploy Scripts
The following scripts are added to `package.json`:
- `"predeploy": "npm run build"`: Runs automatically before deploying to generate the latest production build.
- `"deploy": "gh-pages -d dist"`: Publishes the contents of the `dist/` folder to the `gh-pages` branch on GitHub.

### Step 2: Running the Deployment
To deploy the application to your GitHub Pages repository:
1. Ensure your local code is committed and pushed to `main`.
2. Run the deploy command:
   ```bash
   npm run deploy
   ```
3. The tool will build your app, create/update the `gh-pages` branch on GitHub, and upload the build.
4. Go to your GitHub Repository -> **Settings** -> **Pages**, and ensure the source is set to deploy from the `gh-pages` branch. Your app will be live within a few minutes!
