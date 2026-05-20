const express = require('express');
const router = express.Router();
const { TranslationHistory } = require('../models');

// Get flashcards (favorites due for review)
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const now = new Date();
        const flashcards = await TranslationHistory.find({
            email,
            isFavorite: true,
            nextReviewDate: { $lte: now }
        }).sort({ nextReviewDate: 1 }).limit(20);

        res.json(flashcards);
    } catch (err) {
        console.error("Get flashcards error:", err);
        res.status(500).json({ error: "Failed to fetch flashcards" });
    }
});

// Get all favorites as flashcards (for deck overview)
router.get('/all', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const flashcards = await TranslationHistory.find({
            email,
            isFavorite: true
        }).sort({ createdAt: -1 });

        res.json(flashcards);
    } catch (err) {
        console.error("Get all flashcards error:", err);
        res.status(500).json({ error: "Failed to fetch flashcards" });
    }
});

// Review a flashcard (spaced repetition update)
router.post('/:id/review', async (req, res) => {
    try {
        const { knew } = req.body; // true = knew it, false = didn't know
        const flashcard = await TranslationHistory.findById(req.params.id);

        if (!flashcard) {
            return res.status(404).json({ error: "Flashcard not found" });
        }

        // SM-2 inspired spaced repetition algorithm
        let { repetitionLevel, easeFactor } = flashcard;

        if (knew) {
            // Increase repetition level
            repetitionLevel = Math.min(repetitionLevel + 1, 10);
            // Calculate next review based on level
            const intervals = [1, 3, 7, 14, 30, 60, 120, 240, 365, 730]; // days
            const daysUntilNext = intervals[Math.min(repetitionLevel, intervals.length - 1)];
            flashcard.nextReviewDate = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);
            // Slightly increase ease factor
            easeFactor = Math.min(easeFactor + 0.1, 3.0);
        } else {
            // Reset to beginning
            repetitionLevel = 0;
            flashcard.nextReviewDate = new Date(Date.now() + 10 * 60 * 1000); // Review in 10 minutes
            // Decrease ease factor
            easeFactor = Math.max(easeFactor - 0.2, 1.3);
        }

        flashcard.repetitionLevel = repetitionLevel;
        flashcard.easeFactor = easeFactor;
        await flashcard.save();

        res.json({ 
            success: true, 
            nextReviewDate: flashcard.nextReviewDate,
            repetitionLevel: flashcard.repetitionLevel 
        });
    } catch (err) {
        console.error("Review flashcard error:", err);
        res.status(500).json({ error: "Failed to update flashcard" });
    }
});

// Get flashcard stats
router.get('/stats', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email required" });
        }

        const now = new Date();
        const totalCards = await TranslationHistory.countDocuments({ email, isFavorite: true });
        const dueCards = await TranslationHistory.countDocuments({ 
            email, 
            isFavorite: true,
            nextReviewDate: { $lte: now }
        });
        const masteredCards = await TranslationHistory.countDocuments({
            email,
            isFavorite: true,
            repetitionLevel: { $gte: 5 }
        });

        res.json({ totalCards, dueCards, masteredCards });
    } catch (err) {
        console.error("Get stats error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

module.exports = router;
