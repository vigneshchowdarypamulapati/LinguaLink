const Joi = require('joi');

// Validation schemas
const schemas = {
    signup: Joi.object({
        fname: Joi.string().min(1).max(50).required(),
        lname: Joi.string().min(1).max(50).required(),
        username: Joi.string().min(3).max(30).alphanum().optional(),
        dob: Joi.string().optional(),
        email: Joi.string().email().required(),
        pass: Joi.string().min(6).max(100).required()
    }),

    signin: Joi.object({
        email: Joi.string().email().required(),
        pass: Joi.string().required()
    }),

    translate: Joi.object({
        text: Joi.string().min(1).max(10000).required(),
        sourceLang: Joi.string().optional(),
        targetLang: Joi.string().required()
    }),

    workspace: Joi.object({
        name: Joi.string().min(1).max(100).required()
    }),

    invite: Joi.object({
        email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(6).max(100).required()
    }),

    forgotPassword: Joi.object({
        email: Joi.string().email().required()
    })
};

/**
 * Validation middleware factory
 */
function validate(schemaName) {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            return next();
        }

        const { error, value } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(d => d.message);
            return res.status(400).json({ 
                status: 'error', 
                message: 'Validation failed',
                errors 
            });
        }

        req.body = value; // Use sanitized values
        next();
    };
}

module.exports = { validate, schemas };
