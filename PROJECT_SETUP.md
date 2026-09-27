# Ticketmaster Project - Complete Setup

## 📍 Project Location
**Main Directory:** `C:\Users\HP OMEN\Desktop\Dev Projects\Ticketmaster\ticketmaster`

All development should now happen in this directory. The `C:\Users\HP OMEN\Desktop\omniroute\Resell` folder is a backup/reference only.

## 🚀 Quick Start

### Start Everything (Recommended)
```bash
cd "C:\Users\HP OMEN\Desktop\Dev Projects\Ticketmaster\ticketmaster"
npm run dev
```

This single command starts:
- ✅ Main Backend (port 3001) - green
- ✅ Resell Backend (port 3002) - magenta  
- ✅ Frontend (port 5173) - cyan

### Start for Production
```bash
npm start
```

## 🎯 What's Included

### Main Features
- **Events Management** - Create, edit, delete events
- **Ticket Transfers** - Send tickets via email
- **Admin Dashboard** - Full event & ticket management
- **Apple Wallet** - Generate wallet passes

### NEW: Resell Feature
- **Admin Resell Dashboard** (`/sell`) - Create private resale listings
- **Multi-Payment Support** - CashApp, PayPal, Venmo, Zelle, Apple Pay, Bank, Cash
- **QR Code Payments** - Scan to pay with pre-filled amounts
- **Buyer Checkout** (`/resell/:uniqueLink`) - Secure public buyer page
- **Real-time Polling** - Auto-updates when payment confirmed
- **Apple Wallet Delivery** - Instant ticket delivery after payment

## 📂 Project Structure

```
ticketmaster/
├── backend/
│   ├── server.js              # Main backend (port 3001)
│   ├── resell-server.js       # Resell backend (port 3002)
│   ├── wallet.js              # Apple Wallet generation
│   ├── mailer.js              # Email handling
│   └── package.json
├── src/
│   ├── admin/                 # Admin dashboard
│   ├── components/            # Main app components
│   ├── emails/                # Email templates
│   ├── fees/                  # Transfer fee pages
│   ├── resell/                # 🆕 Resell feature
│   │   ├── pages/
│   │   │   ├── AdminSell.jsx       # Admin resell dashboard
│   │   │   ├── AdminSell.css
│   │   │   ├── BuyerResell.jsx     # Buyer checkout page
│   │   │   └── BuyerResell.css
│   │   └── api.js                  # Resell API client
│   ├── App.jsx                # Main app with routes
│   └── api.js                 # Main API client
├── package.json               # Frontend config
├── RESELL_README.md          # Detailed resell documentation
└── README.md                  # Main project docs
```

## 🔗 Routes

### Admin (Protected)
- `/admin` - Admin login
- `/admin/dashboard` - Main admin dashboard
- `/sell` - **Resell tickets dashboard** 🆕

### Public
- `/` - Public events page
- `/resell/:uniqueLink` - **Buyer checkout page** 🆕
- `/firstfee`, `/secondfee`, etc. - Transfer fee flow

## 🗄️ Database

Uses single MySQL database with tables:
- `admins` - Admin accounts
- `events` - Event listings
- `ticket_access` - Transfer tokens
- `resell_listings` - **Resale tickets** 🆕
- `payment_verifications` - **Payment tracking** 🆕

## 🔧 Environment Variables

**Location:** `backend/.env`

Required:
```env
# Database
MYSQL_HOST=your-host
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=railway

# Auth
JWT_SECRET=your-secret-key

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_USER=your-email
SMTP_PASS=your-password
```

## 📱 Resell Feature Workflow

### Admin Side:
1. Login → Click "Resell Tickets" button
2. Create listing → Select event & tickets
3. Set price & payment methods
4. Generate unique link
5. Share link with buyer
6. Confirm payment when received

### Buyer Side:
1. Open unique link
2. View ticket details
3. Enter contact info
4. Select payment method
5. Scan QR code (opens app with amount)
6. Send payment
7. Submit confirmation
8. Page auto-refreshes when admin confirms
9. Download Apple Wallet pass

## 🎨 Payment Methods

| Method | Format | Experience |
|--------|--------|------------|
| CashApp | `$CashTag` | QR code → Opens Cash App with amount |
| PayPal | Email | Link → Opens PayPal.me |
| Venmo | `@username` | QR code → Opens Venmo with note |
| Zelle | Email | Display recipient email |
| Apple Pay | Phone | Display phone for iMessage |
| Bank | Account/Routing | Display account details |
| Cash/ATM | Custom text | Display instructions |

## 🛠️ Common Commands

```bash
# Start everything
npm run dev

# Install dependencies (run once)
npm install

# Build for production
npm run build

# Run only main backend
cd backend && npm run main

# Run only resell backend
cd backend && npm run resell
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3001
npx kill-port 3001

# Kill process on port 3002
npx kill-port 3002

# Kill process on port 5173
npx kill-port 5173
```

### Database connection failed
- Check MySQL is running
- Verify credentials in `backend/.env`
- Ensure database exists

### Can't access /sell page
- Make sure you're logged into admin first
- Check localStorage has `adminToken`
- Verify both backends are running (ports 3001 & 3002)

### QR codes not working
- Test on mobile device (not desktop)
- Verify payment details are correct
- Check deep link format in browser console

## 📊 Ports

| Service | Port | Color |
|---------|------|-------|
| Main Backend | 3001 | Green |
| Resell Backend | 3002 | Magenta |
| Frontend | 5173 | Cyan |

## 🔐 Security

- JWT authentication for admin routes
- Unique 48-char random tokens for resell links
- Capability-URL pattern (token = access)
- Payment verification before wallet delivery
- CORS configured for production domains
- No PII in URLs

## 📝 Development Notes

- Both backends share same MySQL database
- Frontend uses single React app with all routes
- Resell backend is independent (can be deployed separately)
- Auto-polling every 5 seconds for payment status
- QR codes use `qrcode.react` library v4.2.0

## 🚢 Deployment

Current: Railway (production backend running)

To deploy resell feature:
1. Push code to git
2. Railway auto-deploys both servers
3. Update frontend env to point to production API
4. Done! 🎉

---

**Last Updated:** September 2, 2026
**Status:** ✅ Fully Integrated & Ready for Development
