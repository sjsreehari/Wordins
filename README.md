# Wordins 💬

**Chat. Create. Connect.**

Wordins is a modern, real-time chat application built with React and Firebase. It provides a beautiful, accessible interface for creating and joining chat rooms, with features like custom avatars, invite-only rooms, and fun interactive effects.

![Wordins Logo](https://img.shields.io/badge/Wordins-Chat%20App-purple?style=for-the-badge&logo=chat&logoColor=white)

## ✨ Features

### 🏠 **Home Dashboard**
- **Create Chat Rooms**: Start your own chat rooms with custom names
- **Join Existing Rooms**: Connect to public or private rooms
- **Recent Rooms**: Quick access to your recently visited chat rooms
- **Room Management**: Leave rooms, view room info, and manage memberships
- **Invite-Only Rooms**: Create private rooms with approval-based joining

### 💬 **Real-Time Chat**
- **Live Messaging**: Instant message delivery with Firebase Firestore
- **Typing Indicators**: See when others are typing
- **Message Timestamps**: Track when messages were sent
- **Emoji Support**: Built-in emoji picker for expressive communication
- **Message Effects**: Send fun effects like confetti, balloons, and fireworks
- **Auto-scroll**: Automatically scroll to new messages
- **Responsive Design**: Works seamlessly on desktop and mobile

### 👤 **User Experience**
- **Google Authentication**: Secure login with Google OAuth
- **Custom Avatars**: Choose from 8 unique avatar options
- **Profile Management**: Personalize your profile and settings
- **Accessibility**: Full keyboard navigation and screen reader support
- **Toast Notifications**: Real-time feedback for all actions
- **Loading States**: Smooth loading indicators throughout the app

### 🎨 **Visual Design**
- **Modern UI**: Beautiful gradient backgrounds and glassmorphism effects
- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: Engaging transitions and hover effects
- **Dark/Light Theme**: Elegant color scheme with purple and blue gradients
- **Interactive Elements**: Hover effects, focus states, and micro-interactions

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled
- Google OAuth configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wordins.git
   cd wordins
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Configuration**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Google Authentication
   - Configure Firestore security rules (see `firestore.rules`)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Helmet** - SEO and meta tag management

### Backend & Services
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Authentication** - Google OAuth integration
- **React Firebase Hooks** - Firebase integration for React

### UI/UX Libraries
- **React Canvas Confetti** - Celebration effects
- **Date-fns** - Date formatting utilities
- **React Icons** - Icon library
- **Motion** - Animation library

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **ESLint** - Code linting (if configured)

## 📁 Project Structure

```
wordins/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Basic UI components (Button, Input, Switch)
│   │   ├── Toast.jsx      # Toast notification system
│   │   └── EffectsOverlay.jsx # Chat effects overlay
│   ├── pages/             # Main application pages
│   │   ├── Home.jsx       # Dashboard and room management
│   │   ├── ChatRoom.jsx   # Chat interface
│   │   └── Login.jsx      # Authentication page
│   ├── assets/            # Images and static files
│   │   └── avatar*.png    # User avatar options
│   ├── styles/            # Global styles
│   │   └── index.css      # Tailwind and custom CSS
│   ├── utils/             # Utility functions
│   │   └── cn.ts          # Class name utility
│   ├── firebase.js        # Firebase configuration
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Application entry point
├── firestore.rules        # Firestore security rules
├── netlify.toml           # Netlify deployment configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Other Platforms
The app can be deployed to any static hosting service:
- Vercel
- GitHub Pages
- Firebase Hosting
- AWS S3 + CloudFront

## 🔐 Security

- **Firestore Rules**: Configured to secure user data and chat rooms
- **Authentication**: Google OAuth for secure user authentication
- **Input Validation**: Client-side validation for all user inputs
- **XSS Protection**: Sanitized user inputs and safe rendering

## 🎯 Key Features Explained

### Room Management
- **Public Rooms**: Anyone can join with the room name
- **Invite-Only Rooms**: Require approval from room creators
- **Recent Rooms**: Automatically tracks and displays recently visited rooms
- **Room Info**: View member count, creation date, and room settings

### Real-Time Features
- **Live Updates**: Messages appear instantly across all connected clients
- **Typing Indicators**: Real-time typing status for all users
- **Member Management**: Live updates when users join or leave
- **Join Requests**: Real-time approval system for private rooms

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: Full keyboard navigation and ARIA labels
- **Loading States**: Smooth loading indicators for all async operations
- **Error Handling**: Comprehensive error messages and fallbacks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sreehari S J**
- GitHub: [@sjsreehari](https://github.com/sjsreehari)
- LinkedIn: [sreeharisj](https://www.linkedin.com/in/sreeharisj/)
- Instagram: [@sj_sreehari](https://www.instagram.com/sj_sreehari/)

## 🙏 Acknowledgments

- Firebase for providing excellent real-time database services
- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- All open-source contributors who made this project possible

## 🔮 Future Features

- [ ] Voice and video calling integration
- [ ] File sharing capabilities
- [ ] Message reactions and replies
- [ ] Custom themes and personalization
- [ ] Mobile app (React Native)
- [ ] Advanced moderation tools
- [ ] Bot integration
- [ ] Message search and history
- [ ] Push notifications
- [ ] Multi-language support

---

**Made with ❤️ by Sreehari S J**

*Chat. Create. Connect. - That's Wordins!*
