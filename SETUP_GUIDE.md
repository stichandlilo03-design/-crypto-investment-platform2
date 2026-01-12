# 🚀 Complete Setup Guide - Crypto Investment Platform

## 📋 Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Google Cloud Console account (for Google OAuth)
- GitHub account (for GitHub OAuth)

---

## 🗄️ Part 1: Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new project
4. Wait 2-3 minutes for setup

### 2. Get Your Credentials
1. Go to Project Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Database Tables
Go to SQL Editor and run this:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  kyc_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
  average_buy_price DECIMAL(18, 2),
  total_invested DECIMAL(18, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_symbol)
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'buy', 'sell', 'transfer')),
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  price_at_transaction DECIMAL(18, 2),
  total_value DECIMAL(18, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'failed')),
  payment_method TEXT,
  payment_proof_url TEXT,
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'profit', 'kyc', 'admin', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  currency_preference TEXT DEFAULT 'USD',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'dark',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for portfolios
CREATE POLICY "Users can view own portfolio" ON public.portfolios
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own portfolio" ON public.portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own portfolio" ON public.portfolios
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all transactions" ON public.transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Enable Storage for Payment Proofs
1. Go to Storage
2. Create new bucket called `payment-proofs`
3. Make it public or configure policies

---

## 🔐 Part 2: Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen
6. Application type: "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.vercel.app/auth/callback` (production)
8. Copy Client ID and Client Secret

### GitHub OAuth Setup

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: CryptoVault
   - Homepage URL: `http://localhost:3000` or your domain
   - Authorization callback URL: `http://localhost:3000/auth/callback`
4. Click "Register application"
5. Copy Client ID
6. Generate and copy Client Secret

### Configure in Supabase

1. Go to Authentication → Providers
2. Enable Google:
   - Paste Google Client ID
   - Paste Google Client Secret
3. Enable GitHub:
   - Paste GitHub Client ID
   - Paste GitHub Client Secret

---

## 💰 Part 3: CoinGecko API (Free Live Prices)

### Free Tier (No Registration Needed)
The CoinGecko API is FREE for basic use with no API key required!
- 10-30 calls/minute
- Perfect for this project

### Optional: Pro Tier
If you want more calls:
1. Go to [CoinGecko](https://www.coingecko.com/en/api)
2. Sign up for Pro tier
3. Get API key
4. Add to `.env.local`

---

## 🛠️ Part 4: Local Setup

### 1. Install Dependencies
```bash
cd crypto-full-backend
npm install
```

### 2. Create .env.local
Copy `.env.example` to `.env.local` and fill in all values:
```bash
cp .env.example .env.local
```

### 3. Add Your Credentials
Edit `.env.local` with your actual values from above steps.

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 👨‍💼 Part 5: Create Admin Account

### Method 1: Through Supabase Dashboard
1. Go to Authentication → Users
2. Create new user with your admin email
3. Go to SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Method 2: Through Signup (Then Promote)
1. Sign up normally through your app
2. Use SQL Editor to promote:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

---

## 🚀 Part 6: Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Complete crypto platform with backend"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Add Environment Variables:
   - Copy all from `.env.local`
   - Update `NEXT_PUBLIC_SITE_URL` to your Vercel URL
4. Deploy!

### 3. Update OAuth Callbacks
After deployment, update redirect URIs in:
- Google Cloud Console
- GitHub OAuth App
- Supabase Auth settings

Add your Vercel URL: `https://your-app.vercel.app/auth/callback`

---

## ✅ Testing Checklist

- [ ] User can register with email
- [ ] User can login with email
- [ ] User can login with Google
- [ ] User can login with GitHub
- [ ] User can view dashboard
- [ ] User can create deposit request
- [ ] User can upload payment proof
- [ ] Admin can login to /admin
- [ ] Admin can see all users
- [ ] Admin can approve/reject transactions
- [ ] Live crypto prices showing
- [ ] Notifications working
- [ ] Portfolio updates correctly

---

## 🆘 Troubleshooting

### "Invalid API key"
- Check your Supabase keys are correct
- Make sure you're using `anon` key for client-side

### OAuth not working
- Verify redirect URIs match exactly
- Check credentials are correct in Supabase

### Database errors
- Ensure all tables and policies are created
- Check RLS is enabled

### "User not found"
- Profile might not have been created
- Check the trigger is working

---

## 📚 API Endpoints Used

### CoinGecko (Free)
- Prices: `https://api.coingecko.com/api/v3/simple/price`
- Market data: `https://api.coingecko.com/api/v3/coins/markets`
- Charts: `https://api.coingecko.com/api/v3/coins/{id}/market_chart`

### Example Request
```javascript
const response = await fetch(
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
);
```

---

## 🎉 You're All Set!

Your platform now has:
✅ Real authentication with email, Google, GitHub
✅ User profiles and roles
✅ Real database for all data
✅ Payment proof upload system
✅ Admin approval workflow
✅ Live crypto prices from CoinGecko
✅ Notifications system
✅ Fully functional dashboard & admin panel

Start developing and customizing! 🚀
