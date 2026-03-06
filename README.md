# Vibeo Mobile - Mobile app version for vibeo.

## Table of Contents
- [About the Project](#about-the-project)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Backend Development](#backend-development)
- [Contributing](#contributing)

## About the Project
vibeo-mobile is the official mobile application counterpart for the vibeo platform. It is designed to provide a seamless mobile experience, integrating fully with the vibeo backend architecture to deliver features on the go.

## Technologies
This project is built using modern mobile development frameworks and backend services:
- React Native (via Expo)
- TypeScript (100% of the codebase)
- Convex (Backend-as-a-Service for real-time data and serverless functions)

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your local machine:
- Node.js (version 16.x or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (if you plan to test on a physical device)
- A Convex account for managing backend services

### Installation
1. Clone the repository:
   git clone https://github.com/ADET-AI-Assistant/vibeo-mobile.git

2. Navigate into the project directory:
   cd vibeo-mobile

3. Install the dependencies:
   npm install

4. Configure your environment variables:
   Copy the `.env.example` file to create a `.env` file and fill in the necessary keys.
   cp .env.example .env

## Usage

To start the local development server, run:
npm run start

This will start the Expo Metro bundler. From the terminal, you can press `a` to open the app on an Android emulator, `i` for an iOS simulator, or scan the provided QR code with the Expo Go app on your physical device.

## Project Structure
- `/assets`: Static assets including images, icons, and fonts.
- `/convex`: Contains all backend logic, database schema, and serverless functions powered by Convex.
- `/src`: The main directory for the React Native application source code, including components, screens, and navigation.
- `App.tsx`: The root component of the application.
- `app.json`: Configuration file for Expo settings and app metadata.
- `convex.json`: Configuration file for the Convex backend environment.
- `index.ts`: The main entry point for the React Native registry.

## Backend Development
This project utilizes Convex for its database and backend functions.

To start the Convex development server and continuously sync your backend functions, run:
npx convex dev

This command will automatically track and push changes from your `/convex` directory to your Convex deployment. Make sure your `.env` file correctly contains your Convex deployment URL.

## Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request
