const isProduction = process.env.NODE_ENV === 'production';

// Cookie configuration with enhanced security
const cookieOptions = {
    httpOnly: true,           // Prevent XSS access to cookies
    secure: isProduction,     // HTTPS only in production
    sameSite: isProduction ? "strict" : "lax", // Strict for production, lax for dev
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',                // Cookie available for entire site
    // signed: true,          // Enable if using cookie-parser with secret
};

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'https://lingualink-422af.web.app',
        'https://lingualink-422af.firebaseapp.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Supported languages
const supportedLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Hindi',
    'Arabic', 'Korean', 'Turkish', 'Vietnamese', 'Thai'
];

// Language code mapping
const languageCodeMap = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Chinese': 'zh-CN',
    'Hindi': 'hi',
    'Arabic': 'ar',
    'Korean': 'ko',
    'Turkish': 'tr',
    'Vietnamese': 'vi',
    'Thai': 'th'
};

module.exports = {
    isProduction,
    cookieOptions,
    corsOptions,
    supportedLanguages,
    languageCodeMap
};
