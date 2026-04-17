"""
AI-powered Complaint Classification Module
Classifies social media posts as HELP_REQUEST, INFORMATIONAL, RESOLVED, or SPAM
"""

import re
from typing import Dict, Tuple

try:
    from textblob import TextBlob
except ModuleNotFoundError:
    TextBlob = None

class ComplaintClassifier:
    """NLP-based classifier for social media complaints"""
    
    def __init__(self):
        # Keywords for each classification type
        self.HELP_KEYWORDS = {
            "please": 0.8, "need": 0.9, "help": 1.0, "fix": 0.85,
            "issue": 0.9, "problem": 0.9, "urgent": 0.85, "broken": 0.9,
            "not working": 1.0, "complaint": 0.95, "request": 0.7,
            "demanding": 0.8, "require": 0.75, "suffering": 0.85,
            "suffering from": 0.9, "facing": 0.8, "struggling": 0.85,
            "can't": 0.8, "cannot": 0.8, "doesn't work": 0.95,
            "terrible": 0.7, "horrible": 0.7, "worst": 0.7,
            "when will": 0.8, "how long": 0.75, "action": 0.7
        }
        
        self.RESOLVED_KEYWORDS = {
            "resolved": 1.0, "fixed": 1.0, "solved": 1.0, "thank you": 0.9,
            "thanks": 0.85, "finally": 0.75, "fixed now": 1.0, "working now": 1.0,
            "great job": 0.8, "appreciate": 0.8, "wonderful": 0.6,
            "excellent service": 0.9, "issue solve": 0.95, "problem resolved": 0.95,
            "completed": 0.85, "done": 0.7, "all good": 0.8, "sorted": 0.85
        }
        
        self.SPAM_KEYWORDS = {
            "buy now": 1.0, "click here": 0.95, "promotion": 0.9, "discount": 0.85,
            "limited time": 0.8, "offer": 0.7, "ad": 0.8, "advertise": 0.95,
            "link": 0.6, "http": 0.5, "https": 0.5, "www": 0.5,
            "follow": 0.5, "like": 0.4, "share": 0.4, "subscribe": 0.7,
            "check out": 0.6, "check this": 0.6, "lol": 0.4, "haha": 0.3,
            "emoji": 0.3, "random": 0.5, "meaningless": 0.8
        }
        
        self.INFORMATIONAL_KEYWORDS = {
            "aware": 0.8, "know": 0.6, "notice": 0.7, "learned": 0.6,
            "discovered": 0.7, "found": 0.5, "interesting": 0.5,
            "information": 0.8, "report": 0.6, "showing": 0.5,
            "appears": 0.6, "seems": 0.5, "apparently": 0.6
        }

    def classify_complaint(self, text: str) -> Dict:
        """
        Classify a complaint into categories
        
        Returns:
        {
            "type": "HELP_REQUEST" | "INFORMATIONAL" | "RESOLVED" | "SPAM",
            "confidence": float (0.0-1.0),
            "scores": {"help": float, "resolved": float, "spam": float, "info": float}
        }
        """
        
        if not text or len(text.strip()) < 5:
            return {
                "type": "SPAM",
                "confidence": 0.95,
                "scores": {"help": 0.0, "resolved": 0.0, "spam": 0.95, "info": 0.05},
                "reason": "Text too short"
            }
        
        # Normalize text
        clean_text = self._normalize_text(text)
        text_lower = clean_text.lower()
        
        # Calculate scores
        help_score = self._calculate_keyword_score(text_lower, self.HELP_KEYWORDS)
        resolved_score = self._calculate_keyword_score(text_lower, self.RESOLVED_KEYWORDS)
        spam_score = self._calculate_keyword_score(text_lower, self.SPAM_KEYWORDS)
        info_score = self._calculate_keyword_score(text_lower, self.INFORMATIONAL_KEYWORDS)
        
        # Apply sentiment analysis
        sentiment_adjustment = self._analyze_sentiment(text)
        
        # Adjust scores based on sentiment
        if sentiment_adjustment["sentiment"] == "negative":
            help_score += 0.15
            spam_score -= 0.1
        elif sentiment_adjustment["sentiment"] == "positive":
            resolved_score += 0.15
            spam_score -= 0.15
        
        # URL detection penalty
        if self._has_urls(text):
            spam_score += 0.3
        
        # Emoji spam detection
        if self._is_emoji_spam(text):
            spam_score += 0.2
        
        # Determine final classification
        scores = {
            "help": min(help_score, 1.0),
            "resolved": min(resolved_score, 1.0),
            "spam": min(spam_score, 1.0),
            "info": min(info_score, 1.0)
        }
        
        # Find the highest score
        max_type = max(scores.items(), key=lambda x: x[1])
        complaint_type = max_type[0].upper()
        confidence = max_type[1]
        
        # Map to actual types
        type_mapping = {
            "HELP": "HELP_REQUEST",
            "RESOLVED": "RESOLVED",
            "SPAM": "SPAM",
            "INFO": "INFORMATIONAL"
        }
        
        final_type = type_mapping[complaint_type]
        
        return {
            "type": final_type,
            "confidence": confidence,
            "scores": scores,
            "sentiment": sentiment_adjustment["sentiment"],
            "reason": f"Detected '{final_type}' with {confidence:.2f} confidence"
        }
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for processing"""
        # Convert to lowercase (done in scoring)
        # Remove extra whitespace
        text = " ".join(text.split())
        # Remove special characters but keep meaningful ones
        return text
    
    def _calculate_keyword_score(self, text: str, keywords: Dict[str, float]) -> float:
        """Calculate score based on keyword matching"""
        score = 0.0
        matched_count = 0
        
        for keyword, weight in keywords.items():
            if keyword in text:
                score += weight
                matched_count += 1
        
        # Normalize score
        if matched_count == 0:
            return 0.0
        
        # Average with boosting for multiple matches
        return min((score / len(keywords)) * (1 + matched_count * 0.1), 1.0)
    
    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment using TextBlob"""
        if TextBlob is None:
            return self._fallback_sentiment(text)

        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity < -0.1:
                return {"sentiment": "negative", "polarity": polarity}
            elif polarity > 0.1:
                return {"sentiment": "positive", "polarity": polarity}
            else:
                return {"sentiment": "neutral", "polarity": polarity}
        except:
            return self._fallback_sentiment(text)

    def _fallback_sentiment(self, text: str) -> Dict:
        """Lightweight sentiment fallback when TextBlob is unavailable."""
        positive_words = {
            "good", "great", "resolved", "fixed", "thanks", "thank", "excellent",
            "happy", "satisfied", "working", "done", "appreciate", "wonderful"
        }
        negative_words = {
            "bad", "broken", "urgent", "issue", "problem", "help", "complaint",
            "terrible", "worst", "failed", "unhappy", "angry", "not working"
        }

        text_lower = text.lower()
        positive_hits = sum(1 for word in positive_words if word in text_lower)
        negative_hits = sum(1 for word in negative_words if word in text_lower)

        polarity = (positive_hits - negative_hits) / max(positive_hits + negative_hits, 1)

        if polarity < -0.1:
            sentiment = "negative"
        elif polarity > 0.1:
            sentiment = "positive"
        else:
            sentiment = "neutral"

        return {"sentiment": sentiment, "polarity": polarity}
    
    def _has_urls(self, text: str) -> bool:
        """Check if text contains URLs"""
        url_pattern = r'https?://|www\.|\.com|\.in|\.org'
        return bool(re.search(url_pattern, text, re.IGNORECASE))
    
    def _is_emoji_spam(self, text: str) -> bool:
        """Detect emoji spam patterns"""
        emoji_pattern = r'[\U0001F300-\U0001F9FF]'
        emoji_count = len(re.findall(emoji_pattern, text))
        word_count = len(text.split())
        
        # If more than 30% emojis, it's spam
        if word_count == 0:
            return emoji_count > 5
        return emoji_count / word_count > 0.3
    
    def is_valid_complaint(self, classification: Dict, min_confidence: float = 0.6) -> bool:
        """
        Determine if a complaint is valid for processing
        Valid = HELP_REQUEST with confidence > threshold
        """
        return (
            classification["type"] == "HELP_REQUEST" and 
            classification["confidence"] >= min_confidence
        )


# Initialize classifier
classifier = ComplaintClassifier()


def classify_text(text: str) -> Dict:
    """Public function to classify text"""
    return classifier.classify_complaint(text)


def is_valid_complaint(classification: Dict, min_confidence: float = 0.6) -> bool:
    """Public function to validate complaint"""
    return classifier.is_valid_complaint(classification, min_confidence)
