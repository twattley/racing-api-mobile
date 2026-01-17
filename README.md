# Racing API Mobile

React Native Expo mobile app for the Racing Dashboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
   - Open the app on your device
   - Go to Settings tab
   - Enter your Tailscale IP (e.g., `http://100.x.x.x:3000`)

## Running the app

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on physical iPhone (scan QR code with Expo Go app)
npm start
```

## Tailscale Setup for Mobile Access

1. Install Tailscale on your iPhone from the App Store
2. Sign in with the same account as your Mac mini
3. Connect to your Tailnet
4. Use your Mac mini's Tailscale IP address as the API base URL

Your Mac mini's Tailscale IP can be found by running `tailscale ip` on the Mac mini.

## Features

- Today's Races with live countdown
- Race Details with horse form
- Live Betting selections
- Betting Results summary
- Feedback races
- Configurable API endpoint

## Note on Graphs

This mobile version excludes graphs for performance reasons. Use the web version for graph visualizations.
