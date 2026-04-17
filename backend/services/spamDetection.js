const axios = require("axios");
require("dotenv").config();

/**
 * Service to handle ML-based and rule-based spam detection
 */
const spamDetection = {
    /**
     * Checks if a grievance description is spam
     * @param {string} text - The complaint description
     * @returns {Promise<Object>} - { isSpam, reason, score }
     */
    checkSpam: async (text) => {
        if (!text || text.length < 10) {
            return {
                isSpam: false,
                reason: "Text too short to classify as spam.",
                score: 0
            };
        }

        // 1. Attempt AI-based detection via Python Microservice
        try {
            const pythonUrl = process.env.PYTHON_AI_API_URL || "http://localhost:8000";
            const timeout = parseInt(process.env.SOCIAL_AI_TIMEOUT_MS) || 4000;

            console.log(`[SpamService] Calling AI at ${pythonUrl}/predict`);
            
            const response = await axios.post(`${pythonUrl}/predict`, {
                text: text
            }, {
                timeout: timeout
            });

            // Assuming standard FastAPI response: { is_spam: boolean, confidence: number, label: string }
            if (response.data && typeof response.data.is_spam !== 'undefined') {
                return {
                    isSpam: response.data.is_spam,
                    reason: response.data.label || (response.data.is_spam ? "AI flagged as spam" : "AI flagged as legitimate"),
                    score: response.data.confidence || 0
                };
            }
        } catch (error) {
            console.error(`[SpamService] AI Service Error: ${error.message}. Falling back to Rule-Based detection.`);
        }

        // 2. Rule-Based Fallback (if AI is down or fails)
        return spamDetection.ruleBasedCheck(text);
    },

    /**
     * Local keyword-based fallback detection
     */
    ruleBasedCheck: (text) => {
        const lowerText = text.toLowerCase();
        
        const spamKeywords = [
            "win a prize", "lottery", "jackpot", "click here", "subscribe", 
            "free money", "earn extra income", "cryptocurrency investment",
            "casino", "gambling", "weight loss", "cheap meds", "enlargement",
            "congratulations you won", "claim your reward", "limited time offer"
        ];

        // Check for keywords
        for (const word of spamKeywords) {
            if (lowerText.includes(word)) {
                return {
                    isSpam: true,
                    reason: `Rule-based: Found spam keyword "${word}"`,
                    score: 0.9
                };
            }
        }

        // Check for excessive special characters or URLs (often spammy)
        const urlMatch = lowerText.match(/https?:\/\/[^\s]+/g);
        if (urlMatch && urlMatch.length > 2) {
            return {
                isSpam: true,
                reason: "Rule-based: Excessive links detected",
                score: 0.8
            };
        }

        // Gibberish detection (very basic: long sequences without vowels)
        const gibberishMatch = lowerText.match(/[^aeiou\s]{8,}/g);
        if (gibberishMatch) {
            return {
                isSpam: true,
                reason: "Rule-based: Gibberish/Non-standard text detected",
                score: 0.75
            };
        }

        return {
            isSpam: false,
            reason: "Legitimate (Fallback check)",
            score: 0.1
        };
    }
};

module.exports = spamDetection;
