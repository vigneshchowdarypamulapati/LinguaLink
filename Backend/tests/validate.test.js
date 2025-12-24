const { validate, schemas } = require('../middleware/validate');

describe('Validation Middleware', () => {
    describe('signup schema', () => {
        it('should accept valid signup data', () => {
            const valid = {
                fname: 'John',
                lname: 'Doe',
                email: 'john@example.com',
                pass: 'password123'
            };
            const { error } = schemas.signup.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject invalid email', () => {
            const invalid = {
                fname: 'John',
                lname: 'Doe',
                email: 'not-an-email',
                pass: 'password123'
            };
            const { error } = schemas.signup.validate(invalid);
            expect(error).toBeDefined();
            expect(error.details[0].message).toContain('email');
        });

        it('should reject short password', () => {
            const invalid = {
                fname: 'John',
                lname: 'Doe',
                email: 'john@example.com',
                pass: '123'
            };
            const { error } = schemas.signup.validate(invalid);
            expect(error).toBeDefined();
        });

        it('should require fname and lname', () => {
            const invalid = {
                email: 'john@example.com',
                pass: 'password123'
            };
            const { error } = schemas.signup.validate(invalid);
            expect(error).toBeDefined();
        });
    });

    describe('signin schema', () => {
        it('should accept valid signin data', () => {
            const valid = {
                email: 'john@example.com',
                pass: 'password123'
            };
            const { error } = schemas.signin.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject missing email', () => {
            const invalid = { pass: 'password123' };
            const { error } = schemas.signin.validate(invalid);
            expect(error).toBeDefined();
        });
    });

    describe('translate schema', () => {
        it('should accept valid translation request', () => {
            const valid = {
                text: 'Hello world',
                targetLang: 'es'
            };
            const { error } = schemas.translate.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject empty text', () => {
            const invalid = {
                text: '',
                targetLang: 'es'
            };
            const { error } = schemas.translate.validate(invalid);
            expect(error).toBeDefined();
        });

        it('should reject missing targetLang', () => {
            const invalid = {
                text: 'Hello world'
            };
            const { error } = schemas.translate.validate(invalid);
            expect(error).toBeDefined();
        });
    });

    describe('workspace schema', () => {
        it('should accept valid workspace name', () => {
            const valid = { name: 'My Workspace' };
            const { error } = schemas.workspace.validate(valid);
            expect(error).toBeUndefined();
        });

        it('should reject empty name', () => {
            const invalid = { name: '' };
            const { error } = schemas.workspace.validate(invalid);
            expect(error).toBeDefined();
        });
    });
});
