/**
 * AI Complaint Classifier Service
 * Communicates with Python API for complaint classification
 */

const axios = require("axios");

const PYTHON_API_BASE = process.env.PYTHON_API_URL || "http://localhost:8000";
const CLASSIFICATION_ENDPOINT = `${PYTHON_API_BASE}/classify-complaint`;
const BULK_CLASSIFICATION_ENDPOINT = `${PYTHON_API_BASE}/classify-bulk`;

class ComplaintClassifierService {
  /**
   * Classify a single complaint using Python AI API
   * @param {string} complaintText - The complaint text to classify
   * @param {number} minConfidence - Minimum confidence threshold (0.0-1.0)
   * @returns {Promise<Object>} Classification result
   */
  static async classifyComplaint(complaintText, minConfidence = 0.6) {
    try {
      if (!complaintText || complaintText.trim().length < 5) {
        return {
          type: "SPAM",
          confidence: 0.95,
          is_valid: false,
          scores: { help: 0, resolved: 0, spam: 0.95, info: 0.05 },
          reason: "Text too short for classification"
        };
      }

      const response = await axios.post(
        CLASSIFICATION_ENDPOINT,
        {
          text: complaintText,
          min_confidence: minConfidence
        },
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Classification API Error:", error.message);
      
      // Fallback: Mark as UNCLASSIFIED on API failure
      return {
        type: "UNCLASSIFIED",
        confidence: 0.0,
        is_valid: false,
        scores: { help: 0, resolved: 0, spam: 0, info: 0 },
        reason: `Classification service unavailable: ${error.message}`
      };
    }
  }

  /**
   * Classify multiple complaints in bulk
   * @param {Array<string>} complaintTexts - Array of complaint texts
   * @param {number} minConfidence - Minimum confidence threshold
   * @returns {Promise<Array>} Array of classification results
   */
  static async classifyBulk(complaintTexts, minConfidence = 0.6) {
    try {
      const requests = complaintTexts.map(text => ({
        text,
        min_confidence: minConfidence
      }));

      const response = await axios.post(
        BULK_CLASSIFICATION_ENDPOINT,
        requests,
        { timeout: 30000 }
      );

      return response.data.results || [];
    } catch (error) {
      console.error("❌ Bulk Classification Error:", error.message);
      
      // Fallback: return unclassified for all
      return complaintTexts.map(() => ({
        type: "UNCLASSIFIED",
        confidence: 0.0,
        is_valid: false,
        reason: "Classification service unavailable"
      }));
    }
  }

  /**
   * Check if a classification result is valid for processing
   * @param {Object} classification - Classification result from API
   * @param {number} minConfidence - Minimum confidence threshold
   * @returns {boolean} True if complaint should be processed
   */
  static isValidComplaint(classification, minConfidence = 0.6) {
    return (
      classification.type === "HELP_REQUEST" &&
      classification.confidence >= minConfidence
    );
  }

  /**
   * Filter complaints to keep only valid ones
   * @param {Array<Object>} complaints - Array of complaint objects with text
   * @param {number} minConfidence - Minimum confidence threshold
   * @returns {Promise<Array>} Filtered array of valid complaints
   */
  static async filterValidComplaints(complaints, minConfidence = 0.6) {
    try {
      const texts = complaints.map(c => c.complaintText || c.text || c.content || "");
      const classifications = await this.classifyBulk(texts, minConfidence);

      return complaints.filter((complaint, index) => {
        const classification = classifications[index];
        return this.isValidComplaint(classification, minConfidence);
      });
    } catch (error) {
      console.error("❌ Filter Valid Complaints Error:", error.message);
      return complaints; // Return all on error
    }
  }

  /**
   * Get classification summary statistics
   * @param {Array<Object>} classifications - Array of classification results
   * @returns {Object} Summary statistics
   */
  static getClassificationSummary(classifications) {
    const summary = {
      total: classifications.length,
      byType: {
        HELP_REQUEST: 0,
        INFORMATIONAL: 0,
        RESOLVED: 0,
        SPAM: 0,
        UNCLASSIFIED: 0
      },
      valid: 0,
      invalid: 0,
      averageConfidence: 0
    };

    let totalConfidence = 0;

    classifications.forEach(c => {
      const type = c.type || "UNCLASSIFIED";
      if (summary.byType[type] !== undefined) {
        summary.byType[type]++;
      }

      if (c.is_valid) {
        summary.valid++;
      } else {
        summary.invalid++;
      }

      totalConfidence += c.confidence || 0;
    });

    summary.averageConfidence = summary.total > 0 
      ? (totalConfidence / summary.total).toFixed(2)
      : 0;

    return summary;
  }

  /**
   * Health check for Python API
   * @returns {Promise<boolean>} True if API is accessible
   */
  static async healthCheck() {
    try {
      const response = await axios.get(
        `${PYTHON_API_BASE}/`,
        { timeout: 5000 }
      );
      return response.status === 200;
    } catch (error) {
      console.warn("⚠️  Python API Health Check Failed:", error.message);
      return false;
    }
  }
}

module.exports = ComplaintClassifierService;
