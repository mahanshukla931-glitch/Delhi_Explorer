# Delhi Explorer – Interactive Geospatial Map Application

A production-grade geospatial interactive map application focused on the National Capital Territory of Delhi and destinations across India. Built with **Next.js 14 (App Router)**, **TypeScript**, **Leaflet**, **React-Leaflet**, and **Tailwind CSS**.

100% Free & Keyless APIs — No Google Maps API, no Mapbox, no credit card required.

---

## 🚀 Status & Roadmap

- [x] **Level 1: Map Fundamentals & UI Polish** (100% Completed & Verified)
  - Interactive Leaflet map engine (OSM Standard, Esri Satellite, Esri World Topo Terrain)
  - Seamless Night Mode Theme with synchronized high-contrast dark map tiles
  - 10+ primary Delhi landmarks with custom SVG droplet pins and rich detail cards
  - HTML5 browser geolocation (Locate Me) with accuracy buffer radius
  - Live cursor coordinates and zoom level tracking
  - Google Maps style search card with 400ms debounced Nominatim all-India geocoding
  - Speech Recognition voice search input (Web Speech API)
  - Real-time Open-Meteo live weather & air quality (AQI) widget with responsive mobile flyout
  - Dedicated AI Travel Copilot with multi-stage reasoning and English voice playback
  - Progressive Web App (PWA) with service worker offline tile caching
- [x] **Level 2: Geographic Data & Marker Management** (100% Completed & Verified)
  - Delhi 11 Districts GeoJSON administrative boundaries with 4 demographic metrics (Density, Population, Literacy, Area)
  - Dynamic Choropleth Legend with metric switcher and district details metadata cards
  - Typed Markers API (`/api/markers`) serving 1,200+ Delhi landmark POIs with category filtering & pagination
  - High-performance marker clustering (`leaflet.markercluster`) with custom count badges and Google Maps styled popups
  - Bi-directional synchronization between Places Explorer sidebar and map markers
  - Delhi Metro network overlay with 250+ stations, color-coded lines, and interchange nodes
- [x] **Level 3: Map Interactions & Free APIs** (100% Completed & Verified)
  - Turn-by-Turn OSRM routing engine (`/api/route`) for Driving, Walking, and Cycling modes
  - Animated route polyline navigation layer with maneuver arrows and real road geometries
  - Live vehicle navigation simulation mode with live puck, bearing rotation, and camera tracking
  - Reverse Geocoding on map click (`/api/reverse`) with sanitized locality names
  - Overpass API Nearby Places drawer (`/api/nearby`) finding food, ATMs, healthcare within 1.5 km
  - Interactive Drawing & Measurement tools (Geoman) with live area ($m^2$, $km^2$) and distance ($m$, $km$) calculation
  - Shape persistence in `localStorage` and `/api/shapes` backend with standard GeoJSON Export/Import
- [x] **Level 4: Advanced Features & Production Readiness** (100% Completed & Verified)
  - Canvas-rendered density Heatmap layer (`leaflet.heat`) with auto cluster-separation
  - Live Delhi Traffic congestion overlay color-coded by OSM road speeds
  - Modern Google Maps thumbnail card menu for base map selection
  - Real-time URL State Synchronization (`?lat=...&lng=...&z=...&layer=...`)
  - Full-bleed mobile weather bottom sheet portaled to document body
  - Full-suite Draw Tools Floating Bar (Polygon, Line, Circle, Rectangle, Pin, Edit, Erase, Color selector, Complete Shape button)
  - Complete isolation between district overlay and draw mode (zero popups interfering while drawing)
  - 100% clean production build (`npm run build`, `npm run lint`) with 0 warnings and 0 errors

---

## 🛠 Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Map Library**: Leaflet 1.9 & React-Leaflet 4.2
- **Icons**: Lucide React
- **PWA**: Service Worker Cache API & Web Manifest

---

## 🌟 Architecture & Levels Overview

### Level 1: Map Fundamentals & Responsive Dashboard
- Interactive Leaflet map with multi-layer tiles (Street, Satellite, Terrain, Dark Mode).
- Nominatim geocoding search with debounce, voice mic input, and Wikipedia place cards.
- Live Open-Meteo weather and air quality monitoring with auto GPS detection.
- PWA offline caching with service worker and installable app manifest.
- AI Copilot assistant modal with multi-modal quick guides.

### Level 2: Geographic Data & Marker Management
- **Delhi 11 Districts GeoJSON Choropleth**: Renders administrative boundaries with 3 selectable demographic metrics (Population Density, Total Population, Literacy Rate), dynamic hover effects, and district metadata cards.
- **Interactive Choropleth Legend**: Real-time metric toggle tabs with color swatches and responsive placement.
- **Typed Markers API (`/api/markers`)**: Next.js App Router route serving 1,200+ POIs with category filtering, query search, and pagination.
- **High-Performance Marker Clustering**: `leaflet.markercluster` integration with chunked loading, custom count bubbles, and rich Google Maps styled popups.
- **Bi-directional Synchronization**: Real-time two-way sync between the Places Explorer sidebar and map markers (flying to marker, opening popup, highlighting sidebar card, and synchronized category filters).

---

## 📡 Free Services Used & Usage Limits

All external data and services used in this project are 100% free and require zero paid API keys:

| Service | Purpose | Limits / Policy |
| :--- | :--- | :--- |
| **OpenStreetMap Standard** | Street base map tiles | Free, public tile usage with OSM attribution |
| **Esri World Imagery** | Satellite aerial tile layer | Free public ArcGIS tile service, no API key required |
| **Esri World Topo (Terrain)** | Topographic contour relief layer | Free public ArcGIS tile service |
| **Esri Dark Canvas** | Night mode dark tile layer | Free public ArcGIS tile service with road labels overlay |
| **Nominatim OpenStreetMap** | Real-time geocoding & search | Max 1 request/sec, requires descriptive `User-Agent`, debounced at 400ms |
| **Open-Meteo Weather API** | Live temperature, humidity, wind & AQI | 10,000 requests/day free, zero key required |
| **Wikipedia REST API** | Landmark encyclopedia data & photos | Free, keyless public Wikimedia REST API |
| **Web Speech API** | Voice search mic input | Native browser API, zero cost, runs locally in browser |
| **HTML5 Geolocation API** | Locate me GPS coordinates | Native browser API, requires HTTPS / localhost |

---

## 🔒 How SSR Was Solved

Leaflet relies on browser-only globals (`window`, `document`, `navigator`) during initialization. Running Leaflet during Next.js server-side pre-rendering triggers `ReferenceError: window is not defined`.

This was resolved cleanly using Next.js client-only dynamic imports with SSR disabled:

```tsx
const DynamicMapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});
```

All Leaflet imports, tile event listeners, and map container lifecycles are strictly restricted to client components with `"use client"`, ensuring 100% clean SSR builds and zero hydration mismatches.

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or 10+

### 2. Setup & Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Delhi_Explorer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001)) in your browser.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 🌐 Deploy to Vercel

This repository is optimized for one-click deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep the default Next.js build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Click **Deploy**. Vercel will build and deploy the production site with an instant live HTTPS URL.

---

## ⚠️ Known Limitations

1. **Voice Input Browser Compatibility**: Web Speech API (`webkitSpeechRecognition`) is natively supported on Chromium-based browsers (Chrome, Edge, Brave, Opera) and Safari. On unsupported browsers, manual text typing is used.
2. **Nominatim Rate Limits**: Strict 1 request/sec policy from OpenStreetMap; user typing is debounced at 400ms and cached to prevent 429 rate-limiting.
3. **Geolocation Permissions**: Browser geolocation requires an active HTTPS origin (or `localhost`) and user permission prompt approval.
