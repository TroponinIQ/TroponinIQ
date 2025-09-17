# TroponinIQ 💪

**Expert Bodybuilding & Nutrition Coaching AI**

Get personalized coaching advice powered by 20+ years of experience with world-class athletes and bodybuilders. TroponinIQ combines Justin's extensive knowledge base with advanced AI to provide expert guidance on training, nutrition, and supplementation.


## 🏆 Built on Proven Expertise

TroponinIQ is powered by Justin's comprehensive knowledge base including:
- 20+ years of coaching world-class athletes
- Extensive FAQ database from client interactions
- Proven protocols for muscle gain, fat loss, and performance
- Safe, effective supplement and nutrition strategies
- Product catalog recommendation from Troponin Nutrition

---

## ✨ **Core Features**

### 🤖 **Advanced AI Coaching System**
- **Hybrid Single Agent** - Intelligent routing with specialized tools
- **OpenRouter Integration** - Access to Claude 4, GPT-5, and Gemini models
- **Smart Context Awareness** - Understands your profile and conversation history
- **Multi-tool Integration** - Nutrition calculators, program generators, and product catalog
- **Vector Knowledge Search** - Instant access to 20+ years of coaching expertise

### 🔐 **Secure Authentication & User Management**
- **Email/Password Authentication** - Secure account creation with bcrypt password hashing
- **Google OAuth Integration** - Quick sign-up and login with Google
- **NextAuth.js 5.0** - Industry-standard session management with JWT tokens
- **Persistent Sessions** - Stay logged in across browser sessions
- **Comprehensive User Profiles** - Detailed nutrition and fitness profiles with progress tracking

### 💳 **Subscription & Billing**
- **Stripe Integration** - Secure payment processing with webhooks
- **$29.99/month Subscription** - Unlimited access to AI coaching
- **Subscription Management** - Easy upgrade, downgrade, and cancellation
- **Access Control** - Premium features gated behind subscription
- **Development Mode** - Test mode for development without webhooks

### 📱 **Progressive Web App (PWA)**
- **Installable** - Add to home screen on mobile and desktop
- **Offline Support** - Service worker caching for offline access
- **Push Notifications** - Stay updated with new features and messages
- **Mobile Optimized** - Responsive design optimized for all devices
- **Auto-Updates** - Seamless updates with service worker management

### 🛠️ **Admin Dashboard & System Management**
- **System Messages** - Platform-wide announcements and notifications
- **Message Scheduling** - Set start and end dates for time-sensitive messages
- **Admin Access Control** - Email-based admin permissions

### 📈 **Chat & Conversation Features**
- **Real-time Chat Interface** - Streaming responses with typing indicators
- **Message History** - Persistent chat history across sessions
- **Message Editing** - Edit and improve your questions
- **Conversation Export** - Download chat transcripts
- **Suggested Actions** - Quick access to common requests
- **Profile Integration** - Personalized responses based on your profile

## 🧠 **AI Architecture**

### **Hybrid Agent System**
- **Single Intelligent Agent** - No rigid routing, handles all queries intelligently
- **Tool-Augmented** - Access to nutrition calculators, program generators, and knowledge base
- **Contextual Awareness** - Maintains conversation context and user profile
- **Voice-First Design** - Authentic Justin Harris coaching voice across all responses

### **Knowledge Integration**
- **Vector Database** - PostgreSQL with embeddings for FAQ search
- **Product Catalog** - Structured JSON-based product information
- **Profile Context** - Dynamic user context building for personalized advice
- **Conversation Memory** - Session-based conversation management

### **Model Selection**
- **Claude 4 Sonnet** - Primary model for authentic coaching voice
- **Model Flexibility** - Support for multiple AI providers via OpenRouter
- **Streaming Responses** - Real-time response generation
- **Smart Fallbacks** - Graceful error handling and fallback responses

## 🏗️ **Architecture Overview**

### **Dual Storage Strategy**
- **Firebase Firestore**: User profiles, chat history, and application data
- **PostgreSQL (Supabase)**: Vector database for AI knowledge retrieval
- **Hybrid Benefits**: Permanent data storage + optimized AI performance
- **Session Management**: User-chat isolation with secure session tokens

### **Authentication Flow**
```
User Registration → Firestore User Document → NextAuth Session → Authenticated Access
```

### **AI Processing Flow**
```
User Message → Profile Context → Knowledge Search → Tool Execution → AI Response → Firebase Storage
```

### **Security & Privacy**
- **Password Security**: bcrypt hashing with 12 rounds
- **Session Management**: JWT tokens with secure rotation
- **Data Isolation**: User-specific data access controls
- **HTTPS Only**: Secure communication in production
- **Environment Secrets**: Sensitive data in environment variables

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15** with App Router and TypeScript
- **React 19** with modern hooks and patterns
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** components with Radix primitives
- **Framer Motion** for animations and transitions

### **Backend & Database**
- **Firebase Firestore** for primary data storage
- **Firebase Admin SDK** for server-side operations
- **PostgreSQL (Supabase)** for AI vector search and knowledge base
- **NextAuth.js 5.0** for authentication and session management

### **AI & Tools**
- **OpenRouter** for multi-model AI access (Claude 4, GPT-5, Gemini)
- **LangChain & LangGraph** for agent orchestration
- **Vector Search** with embeddings for knowledge retrieval
- **Custom Tools** for nutrition calculations and program generation

### **Payments & Subscription**
- **Stripe** for payment processing and subscription management
- **Webhooks** for real-time subscription status updates
- **Customer Portal** for subscription management

### **Deployment & Infrastructure**
- **Vercel** for hosting and deployment
- **Edge Runtime** for optimal performance
- **PWA Support** with service workers and caching
- **Analytics** with Vercel Analytics

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project with Firestore enabled
- Supabase project for PostgreSQL vector database
- Google Cloud Console project (for OAuth)
- Stripe account (for subscriptions)
- OpenRouter API key (for AI models)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Mal402/jtt-chat2.git
cd jtt-chat
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables:

#### **Firebase Configuration**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

#### **NextAuth Configuration**
```env
AUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### **AI & Database**
```env
# Supabase (for AI vector database)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter (for AI models)
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### **Stripe (for subscriptions)**
```env
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID=your_subscription_price_id
```

#### **Admin & Email Configuration**
```env
# Admin Access Control  
ADMIN_EMAILS=admin@yourdomain.com,other@yourdomain.com

# Resend Email Service (optional)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

4. **Set up Firebase**
- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable Firestore database
- Generate service account key and save as `firebase-service-account-key.json` in project root
- Set up Firestore security rules for user data protection

5. **Set up Authentication**
- Configure Google OAuth in Google Cloud Console
- Add authorized domains to Firebase Authentication
- Enable Google and Email/Password providers in Firebase Auth settings

6. **Set up Supabase (for AI Vector Database)**
- Create a Supabase project
- Run the SQL setup from `lib/db/migrations/` for vector search
- Configure PostgreSQL credentials

7. **Set up Stripe (for subscriptions)**
- Create a Stripe account and get API keys
- Create a subscription product and price
- Set up webhooks for subscription events
- Configure customer portal settings

8. **Run the development server**
```bash
pnpm dev
```

Your app will be running on [localhost:3000](http://localhost:3000).

## 📁 **Project Structure**

```
jtt-chat/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages & logic
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── auth.config.ts # Auth route protection
│   │   ├── actions.ts     # Server actions for auth
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (chat)/            # Main chat interface
│   │   ├── chat/          # Chat pages and components
│   │   ├── layout.tsx     # Chat layout with sidebar
│   │   └── actions.ts     # Chat server actions
│   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx     # Admin layout with navigation
│   │   ├── page.tsx       # Admin dashboard home
│   │   └── system-messages/ # System message management
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # Chat and AI endpoints
│   │   ├── subscription/  # Stripe subscription endpoints
│   │   ├── download/      # Export and download endpoints
│   │   └── system-messages/ # System message API
│   ├── billing/           # Billing and payment pages
│   ├── payment/           # Payment success/cancel pages
│   ├── install-guide/     # PWA installation guide
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat interface components
│   │   ├── chat.tsx       # Main chat component
│   │   ├── messages.tsx   # Message display
│   │   ├── multimodal-input.tsx # Chat input with file upload
│   │   └── export-button.tsx # Export functionality
│   ├── subscription/      # Subscription and billing components
│   ├── admin/             # Admin dashboard components
│   ├── pwa/               # PWA installation and updates
│   ├── layout/            # Layout components (sidebar, header)
│   ├── ui/                # shadcn/ui components
│   └── common/            # Shared components
├── lib/                   # Utilities and configurations
│   ├── ai/                # AI system and tools
│   │   ├── hybrid-agent.ts # Main AI agent
│   │   ├── models.ts      # AI model configurations
│   │   ├── prompts.ts     # System prompts
│   │   ├── openrouter.ts  # OpenRouter integration
│   │   └── tools/         # AI tools (calculators, etc.)
│   ├── db/                # Database utilities and types
│   │   ├── types.ts       # TypeScript types
│   │   ├── migrations/    # Database migrations
│   │   └── product-catalog/ # Product information
│   ├── firebase/          # Firebase configuration
│   │   ├── admin.ts       # Firebase Admin SDK
│   │   └── profile.ts     # User profile management
│   ├── supabase/          # Supabase configuration
│   │   └── vector-search.ts # Vector search functionality
│   ├── subscription.ts    # Stripe subscription logic
│   └── utils.ts           # General utilities
├── hooks/                 # Custom React hooks
│   ├── use-messages.tsx   # Chat message management
│   ├── use-auto-resume.ts # Auto-resume functionality
│   └── use-mobile.tsx     # Mobile detection
├── public/                # Static assets
│   ├── images/            # Application images
│   ├── sw.js              # Service worker
│   └── site.webmanifest   # PWA manifest
└── scripts/               # Utility scripts
    ├── test-prompts.js    # AI prompt testing
    └── simulate-subscription.js # Subscription testing
```

## 📱 **PWA Features**

### **Installation**
- **Add to Home Screen** - Install on mobile and desktop devices
- **Standalone Mode** - Runs like a native app without browser UI
- **Custom Install Prompt** - Smart prompting for app installation
- **iOS Support** - Special handling for iOS installation process

### **Offline Capabilities**
- **Service Worker** - Caches critical resources for offline access
- **Offline Indicator** - Visual feedback when connection is lost
- **Background Sync** - Queue actions when offline, sync when online
- **Cache Strategies** - Smart caching for different resource types

### **Performance**
- **Resource Caching** - Fonts, images, and assets cached locally
- **API Caching** - Strategic caching of API responses
- **Update Notifications** - Automatic updates with user notification
- **Fast Loading** - Instant loading for repeat visits

## 🎯 **Roadmap**

### **Recently Completed** ✅
- NextAuth.js 5.0 with Google OAuth and email/password authentication
- Stripe subscription system with webhooks and customer portal
- PWA functionality with offline support and auto-updates
- Admin dashboard with system message management
- Export system for nutrition spreadsheets and meal plans
- Hybrid AI agent with tool integration
- Vector knowledge search with Supabase
- Comprehensive user profile system

### **In Progress** 🔄
- Enhanced nutrition calculation tools
- Advanced meal planning features
- Mobile app optimizations
- Performance improvements

### **Upcoming Features** 📋
- **Workout Integration** - Training plan generation and tracking
- **Progress Analytics** - Visual progress tracking and insights
- **Advanced Personalization** - Machine learning-based recommendations
- **Client Management** - Tools for coaches to manage multiple clients
- **API Access** - Public API for third-party integrations
- **Advanced Notifications** - Push notifications for important updates

## 🔒 **Security & Privacy**

### **Data Protection**
- **Encryption at Rest** - All user data encrypted in Firebase and Supabase
- **Secure Transmission** - HTTPS-only communication
- **Data Isolation** - User data strictly separated and access-controlled
- **Regular Backups** - Automated backups with point-in-time recovery

### **Authentication Security**
- **Password Hashing** - bcrypt with 12 salt rounds
- **Session Security** - JWT tokens with automatic rotation
- **OAuth Integration** - Industry-standard Google OAuth implementation
- **CSRF Protection** - Built-in CSRF token validation

### **Privacy Compliance**
- **Data Minimization** - Only collect necessary user information
- **User Control** - Users can export or delete their data
- **Transparent Policies** - Clear privacy policy and terms of service
- **No Third-Party Tracking** - No external analytics or tracking services

## 🤝 **Contributing**

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

### **Development Setup**
1. Follow the installation instructions above
2. Create a feature branch from `main`
3. Make your changes with appropriate tests
4. Submit a pull request with detailed description

### **Areas for Contribution**
- UI/UX improvements
- New AI tools and calculators
- Performance optimizations
- Documentation improvements
- Test coverage

## 📄 **License**

This project is proprietary software. All rights reserved.

---

**TroponinIQ** - Transform your physique with expert coaching powered by AI.