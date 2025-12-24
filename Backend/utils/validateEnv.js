/**
 * Validate required environment variables on startup
 */
function validateEnv() {
    const required = ['MONGO_URL'];
    const optional = ['GEMINI_API_KEY', 'EMAIL_USER', 'EMAIL_PASS', 'JWT_SECRET'];
    const missing = [];
    const warnings = [];

    // Check required variables
    required.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Warn about missing optional variables
    optional.forEach(varName => {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    });

    // Report results
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('⚠️  Missing optional environment variables (some features may be disabled):');
        warnings.forEach(v => console.warn(`   - ${v}`));
    }

    console.log('✅ Environment validation passed');
    
    // Log environment mode
    const mode = process.env.NODE_ENV || 'development';
    console.log(`📍 Running in ${mode} mode`);
}

module.exports = { validateEnv };
