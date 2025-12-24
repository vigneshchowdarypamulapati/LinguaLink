const config = require('../config');

describe('Config Module', () => {
    describe('supportedLanguages', () => {
        it('should include 15 languages', () => {
            expect(config.supportedLanguages).toHaveLength(15);
        });

        it('should include English', () => {
            expect(config.supportedLanguages).toContain('English');
        });

        it('should include new languages', () => {
            expect(config.supportedLanguages).toContain('Arabic');
            expect(config.supportedLanguages).toContain('Korean');
            expect(config.supportedLanguages).toContain('Turkish');
            expect(config.supportedLanguages).toContain('Vietnamese');
            expect(config.supportedLanguages).toContain('Thai');
        });
    });

    describe('languageCodeMap', () => {
        it('should have code for each supported language', () => {
            config.supportedLanguages.forEach(lang => {
                expect(config.languageCodeMap[lang]).toBeDefined();
            });
        });

        it('should map English to en', () => {
            expect(config.languageCodeMap['English']).toBe('en');
        });

        it('should map Chinese to zh-CN', () => {
            expect(config.languageCodeMap['Chinese']).toBe('zh-CN');
        });
    });

    describe('cookieOptions', () => {
        it('should have httpOnly enabled', () => {
            expect(config.cookieOptions.httpOnly).toBe(true);
        });

        it('should have sameSite configured', () => {
            expect(['strict', 'lax', 'none']).toContain(config.cookieOptions.sameSite);
        });

        it('should have maxAge set to 7 days', () => {
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            expect(config.cookieOptions.maxAge).toBe(sevenDays);
        });
    });

    describe('corsOptions', () => {
        it('should allow credentials', () => {
            expect(config.corsOptions.credentials).toBe(true);
        });

        it('should include localhost origins for development', () => {
            expect(config.corsOptions.origin).toContain('http://localhost:5173');
        });

        it('should include production Firebase origin', () => {
            expect(config.corsOptions.origin).toContain('https://lingualink-422af.web.app');
        });
    });
});
