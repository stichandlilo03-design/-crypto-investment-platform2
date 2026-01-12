# CryptoVault - Professional Crypto Investment Platform

A modern, full-featured cryptocurrency investment platform built with Next.js 14, React, TypeScript, and Tailwind CSS. Optimized for Vercel deployment.

## 🚀 Features

### Landing Page
- **Stunning Hero Section** with animated gradients and portfolio preview
- **Feature Highlights** showcasing platform capabilities
- **Client Testimonials** with 5-star ratings
- **Statistics Display** showing platform metrics
- **Responsive Navigation** with smooth scrolling
- **Modern Footer** with quick links

### Authentication
- **Login Page** with email/password and social auth options
- **Registration Page** with comprehensive form validation
- **Password visibility toggle**
- **Remember me functionality**
- **Forgot password flow**

### User Dashboard
- **Portfolio Overview** with real-time balance tracking
- **Asset Management** for Bitcoin, Ethereum, Cardano, Solana, and more
- **Quick Actions** for deposit, withdraw, buy, and sell
- **Transaction History** with detailed activity logs
- **Mini Charts** showing asset performance trends
- **Balance visibility toggle** for privacy
- **Responsive sidebar navigation**

### Admin Panel
- **Analytics Dashboard** with key metrics
- **User Management** with search and filtering
- **Transaction Monitoring** with status tracking
- **System Status** monitoring
- **Export functionality** for reports
- **Real-time notifications**

### Design Features
- **Glass Morphism** effects throughout
- **Gradient Animations** for visual appeal
- **Smooth Transitions** and micro-interactions
- **Dark Theme** optimized for crypto trading
- **Custom Scrollbar** styling
- **Responsive Design** for all screen sizes
- **Framer Motion** animations

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Outfit (Display), Inter (Body)

## 📦 Installation

1. **Clone or download the project:**
```bash
cd crypto-investment-platform
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Deploy to production:**
```bash
vercel --prod
```

### Method 2: GitHub Integration

1. **Push your code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure settings
   - Click "Deploy"

### Method 3: Vercel Dashboard

1. **Build your project locally:**
```bash
npm run build
```

2. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Drag and drop your project folder
   - Click "Deploy"

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env.local` file for environment-specific settings:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

### Vercel Configuration

The project includes a `next.config.js` file optimized for Vercel. No additional configuration needed!

## 📁 Project Structure

```
crypto-investment-platform/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Registration page
│   ├── dashboard/page.tsx       # User dashboard
│   ├── admin/page.tsx          # Admin panel
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/                  # Reusable components (future)
├── lib/                        # Utility functions (future)
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  primary: {
    // Your custom colors
  }
}
```

### Fonts
Update in `app/globals.css`:

```css
@import url('your-google-fonts-url');
```

### Logo
Replace the Wallet icon in navigation with your logo image.

## 🔐 Security Features

- Input validation on all forms
- Password strength requirements
- Session management ready
- XSS protection
- CSRF protection ready
- Secure authentication flow

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] Real-time cryptocurrency price feeds
- [ ] Two-factor authentication
- [ ] KYC verification
- [ ] Live chat support
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Dark/Light theme toggle

## 📄 Pages Overview

### 1. Landing Page (`/`)
- Hero section with animated portfolio preview
- Feature cards with hover effects
- Client testimonials carousel
- Statistics counter
- Call-to-action sections

### 2. Login Page (`/login`)
- Email/password authentication
- Social login options (Google, GitHub)
- Password visibility toggle
- Remember me checkbox
- Forgot password link

### 3. Register Page (`/register`)
- Comprehensive registration form
- Password confirmation
- Terms acceptance
- Social signup options
- Form validation

### 4. Dashboard (`/dashboard`)
- Portfolio overview with total balance
- Asset list with performance charts
- Quick action buttons
- Recent transaction history
- Responsive sidebar navigation

### 5. Admin Panel (`/admin`)
- User management table
- Transaction monitoring
- System analytics
- Export functionality
- Status monitoring

## 💡 Tips for Production

1. **Enable Analytics:** Add Vercel Analytics to track performance
2. **Set up Monitoring:** Use Vercel's built-in monitoring
3. **Configure Domain:** Add custom domain in Vercel settings
4. **Enable HTTPS:** Automatic with Vercel
5. **Set up CI/CD:** Automatic deployments from GitHub

## 🤝 Support

For issues or questions:
- Check the Vercel documentation
- Review Next.js documentation
- Contact your development team

## 📝 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ for secure and professional crypto investing
