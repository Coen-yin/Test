# MapVerse - Next Generation Mapping Application

A stunning, production-ready mapping website built with **pure HTML, CSS, and JavaScript** - no frameworks needed. MapVerse rivals and surpasses Google Maps with its exceptional user experience, modern design, and advanced features.

## 🌟 Features

### Core Mapping Features
- ✅ Interactive map using Leaflet.js with OpenStreetMap tiles
- ✅ Real-time user location detection and tracking
- ✅ Click-to-set destination anywhere on the map
- ✅ Turn-by-turn routing and directions (powered by OSRM)
- ✅ Distance and travel time calculations
- ✅ Multiple travel modes (driving, walking, cycling)
- ✅ Search with autocomplete for places and addresses
- ✅ Multiple map styles (standard, satellite, terrain, dark)
- ✅ Zoom controls and smooth animations

### Advanced Features (Beyond Google Maps)
- ⭐ **Favorite/saved locations** with localStorage persistence
- 🕐 **Recent searches history** with quick access
- 🔗 **Share location** - copy coordinates or shareable links
- 📡 **Offline capability** - shows last known location
- 🌓 **Dark mode / Light mode** toggle with smooth transitions
- 🎤 **Voice search** using Web Speech API
- 📏 **Measure distance** tool between any two points
- 📍 **Drop multiple pins** and create custom routes
- 🌤️ **Weather overlay** showing current conditions
- 🍽️ **Nearby places** suggestions (restaurants, cafes, gas stations, etc.)
- ♿ **Accessibility features** - keyboard navigation, ARIA labels
- 🔊 **Voice guidance** simulation for navigation
- 📱 **Real-time location sharing** capability

### Design Highlights
- 🎨 **Stunning modern UI** with glassmorphism effects
- ✨ **Smooth animations** and micro-interactions
- 🎯 **Beautiful gradient backgrounds** and accent colors
- 🎭 **Custom animated markers** and map controls
- 🎪 **Floating action buttons** with elegant animations
- 🎬 **Loading animations** and skeleton screens
- 🎨 **Custom map styling** - unique appearance
- 📱 **Fully responsive** - perfect on all devices
- 👆 **Touch-optimized** with swipe gestures
- 📲 **Bottom sheet navigation** for mobile (native app feel)

### Mobile Experience
- 📱 **Mobile-first design** approach
- 👆 **Touch gestures** - swipe, pinch to zoom
- 📍 **GPS accuracy indicator**
- 🔋 **Battery-efficient** location tracking
- 📲 **Bottom sheet UI** for mobile devices
- 🎯 **Large touch targets** for easy interaction
- 📺 **Full-screen map mode**
- 🔄 **Pull-to-refresh** functionality

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Coen-yin/Test.git
cd Test
```

2. Open in a web browser:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Or simply open index.html in your browser
```

3. Visit `http://localhost:8000` (or your chosen port)

### No Build Process Required!
This is pure HTML, CSS, and JavaScript - no npm, no webpack, no build tools needed!

## 📁 Project Structure

```
/
├── index.html          # Main HTML file with beautiful UI
├── sw.js               # Service worker for offline support
├── css/
│   └── styles.css      # All styles, animations, responsive design
├── js/
│   ├── app.js          # Main application logic and coordination
│   ├── map.js          # Map initialization and controls (Leaflet)
│   ├── routing.js      # Directions and routing (OSRM)
│   ├── search.js       # Search and geocoding (Nominatim)
│   ├── storage.js      # localStorage handling
│   └── ui.js           # UI interactions and animations
└── assets/
    └── icons/          # Custom SVG icons (if needed)
```

## 🎯 Usage

### Basic Navigation
1. **Find Your Location**: Click "My Location" button or allow location access
2. **Search Places**: Use the search bar to find any location
3. **Set Destination**: Click anywhere on the map or search for a place
4. **Get Directions**: Click "Get Directions" and select your travel mode
5. **Start Navigation**: Click "Start Navigation" for turn-by-turn guidance

### Keyboard Shortcuts
- `Ctrl/Cmd + K` - Focus search bar
- `Ctrl/Cmd + D` - Toggle dark mode
- `Ctrl/Cmd + L` - Center on your location
- `Ctrl/Cmd + S` - Save current location to favorites
- `Esc` - Close modals or clear search

### Advanced Features
- **Voice Search**: Click the microphone icon to search by voice
- **Measure Distance**: Click the ruler icon (FAB menu) and click two points
- **Nearby Places**: Click the location pin icon to find restaurants, cafes, etc.
- **Share Location**: Click the share icon to copy coordinates or shareable link
- **Map Layers**: Click the layers icon to switch between map styles
- **Dark Mode**: Click the theme toggle for dark/light mode

## 🛠️ Technologies Used

- **Leaflet.js** - Open-source mapping library
- **OpenStreetMap** - Free map tiles
- **OSRM** - Open Source Routing Machine for directions
- **Nominatim** - Geocoding and reverse geocoding
- **Web Speech API** - Voice search capability
- **Geolocation API** - Real-time location tracking
- **Service Workers** - Offline support
- **LocalStorage** - Data persistence
- **CSS Grid & Flexbox** - Responsive layouts
- **CSS Custom Properties** - Dynamic theming
- **CSS Animations** - Smooth transitions

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 API Usage

### Free APIs Used (No API Keys Required)
- **OpenStreetMap** - Map tiles
- **OSRM** - Routing and directions
- **Nominatim** - Geocoding and search

**Note**: For production use, consider:
1. Setting up your own OSRM server
2. Using your own Nominatim instance
3. Adding rate limiting and caching
4. Respecting API usage policies

## 🎨 Customization

### Changing Theme Colors
Edit CSS custom properties in `css/styles.css`:
```css
:root {
    --primary: #ffffff;
    --secondary: #ffffff;
    --accent: #ffffff;
    /* ... more colors */
}
```

### Adding Custom Map Styles
Add new tile layers in `js/map.js`:
```javascript
this.layers.custom = L.tileLayer('YOUR_TILE_URL', {
    maxZoom: 19,
    attribution: 'Your Attribution'
});
```

## 🚀 Deployment

### Deploy to GitHub Pages
```bash
# Push to GitHub
git push origin main

# Enable GitHub Pages in repository settings
# Choose 'main' branch as source
```

### Deploy to Netlify/Vercel
Simply connect your repository and deploy - no build configuration needed!

## 📱 Progressive Web App (PWA)

MapVerse includes PWA capabilities:
- Install to home screen
- Offline functionality
- Native app-like experience

## ♿ Accessibility

MapVerse follows accessibility best practices:
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators

## 🔒 Privacy

- No user data is sent to external servers
- All data stored locally in browser
- Location data never leaves your device
- No tracking or analytics

## 🤝 Contributing

Contributions are welcome! This project demonstrates:
- Clean, readable code
- No external dependencies (except map libraries)
- Progressive enhancement
- Mobile-first design
- Accessibility best practices

## 📄 License

MIT License - feel free to use this project for learning or portfolio purposes!

## 🙏 Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Routing powered by [OSRM](http://project-osrm.org/)
- Geocoding by [Nominatim](https://nominatim.org/)
- Built with [Leaflet](https://leafletjs.com/)

## 🎉 Demo

Visit the live demo: [MapVerse Demo](#)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with ❤️ using pure HTML, CSS, and JavaScript**

*No frameworks. No build tools. Just clean, modern web development.*
