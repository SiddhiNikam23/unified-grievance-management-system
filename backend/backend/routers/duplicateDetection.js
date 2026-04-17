//APIs for duplicate complaint checking.

const express = require('express');
const router = express.Router();
const { 
    detectDuplicateComplaints, 
    linkComplaints, 
    getLinkedComplaints 
} = require('../services/duplicateDetection');
const Grievance = require('../models/grievance');
router.post('/check', async (req, res) => {
    try {
        const { description, location, department, category } = req.body;
        if (!description) {
            return res.status(400).json({ 
                error: 'Description is required' 
            });
        }
        const result = await detectDuplicateComplaints({
            description,
            location,
            department,
            category
        });
        res.json(result);
    } catch (error) {
        console.error('Error checking duplicates:', error);
        res.status(500).json({ 
            error: 'Failed to check for duplicates',
            message: error.message 
        });
    }
});
router.post('/link', async (req, res) => {
    try {
        const { newGrievanceCode, existingGrievanceCode, similarityScore, reason } = req.body;
        if (!newGrievanceCode || !existingGrievanceCode) {
            return res.status(400).json({ 
                error: 'Both grievance codes are required' 
            });
        }
        const linkResult = await linkComplaints(newGrievanceCode, existingGrievanceCode);
        if (!linkResult.success) {
            return res.status(500).json({ 
                error: 'Failed to link complaints',
                message: linkResult.error 
            });
        }
        await Grievance.updateOne(
            { grievanceCode: newGrievanceCode },
            {
                $set: {
                    similarityScore,
                    duplicateReason: reason
                }
            }
        );
        res.json({ 
            success: true, 
            message: 'Complaints linked successfully',
            newGrievanceCode,
            linkedTo: existingGrievanceCode
        });
    } catch (error) {
        console.error('Error linking complaints:', error);
        res.status(500).json({ 
            error: 'Failed to link complaints',
            message: error.message 
        });
    }
});
router.get('/linked/:grievanceCode', async (req, res) => {
    try {
        const { grievanceCode } = req.params;
        const result = await getLinkedComplaints(grievanceCode);
        res.json(result);
    } catch (error) {
        console.error('Error getting linked complaints:', error);
        res.status(500).json({ 
            error: 'Failed to get linked complaints',
            message: error.message 
        });
    }
});
router.post('/unlink', async (req, res) => {
    try {
        const { grievanceCode } = req.body;
        if (!grievanceCode) {
            return res.status(400).json({ 
                error: 'Grievance code is required' 
            });
        }
        const complaint = await Grievance.findOne({ grievanceCode });
        if (!complaint) {
            return res.status(404).json({ 
                error: 'Complaint not found' 
            });
        }
        if (!complaint.linkedTo) {
            return res.status(400).json({ 
                error: 'Complaint is not linked to any other complaint' 
            });
        }
        await Grievance.updateOne(
            { grievanceCode: complaint.linkedTo },
            {
                $pull: { linkedComplaints: grievanceCode }
            }
        );
        await Grievance.updateOne(
            { grievanceCode },
            {
                $unset: { 
                    linkedTo: '',
                    similarityScore: '',
                    duplicateReason: ''
                },
                $set: { 
                    isDuplicate: false 
                }
            }
        );
        res.json({ 
            success: true, 
            message: 'Complaint unlinked successfully' 
        });
    } catch (error) {
        console.error('Error unlinking complaint:', error);
        res.status(500).json({ 
            error: 'Failed to unlink complaint',
            message: error.message 
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const totalDuplicates = await Grievance.countDocuments({ isDuplicate: true });
        const totalUnique = await Grievance.countDocuments({ isDuplicate: false });
        const parentsWithLinks = await Grievance.countDocuments({
            linkedComplaints: { $exists: true, $ne: [] }
        });
        res.json({
            totalDuplicates,
            totalUnique,
            parentsWithLinks,
            duplicateRate: totalDuplicates + totalUnique > 0 
                ? ((totalDuplicates / (totalDuplicates + totalUnique)) * 100).toFixed(2) 
                : 0
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ 
            error: 'Failed to get statistics',
            message: error.message 
        });
    }
});
module.exports = router;
