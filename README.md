# Retail Finance Tracker

A comprehensive financial tracking application for retailers to monitor income and expenses in real-time.

## 🌟 Features

- 📊 Real-time profit/loss dashboard with visual analytics
- 💰 Income and expense tracking with detailed categorization
- 📷 Receipt scanning with OCR capabilities
- 📱 Responsive design for mobile and desktop
- 🔐 Secure authentication system
- 📈 Advanced reporting and data export
- 👥 Multi-user support with role-based access

## 🛠️ Tech Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT
- **OCR**: Tesseract.js
- **File Storage**: AWS S3
- **Deployment**: Vercel (Frontend) & Render (Backend)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/retail-finance-tracker.git
cd retail-finance-tracker
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000
REACT_APP_S3_BUCKET=your-s3-bucket

# Backend (.env)
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm start
```

## 📁 Project Structure

```
retail-finance-tracker/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── context/        # React context
│   └── public/             # Static files
│
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   └── config/             # Configuration files
│
└── docs/                   # Documentation
```

## 🔐 Environment Variables

Create `.env` files in both frontend and backend directories with the following variables:

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_S3_BUCKET=your-s3-bucket
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
```

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Backend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy!

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

