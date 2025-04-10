import express from 'express';
import MSListService from '../services/MSListService';

const router = express.Router();
const msListService = new MSListService();

// Approve a request
router.post('/approve-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const approverEmail = req.user?.userDetails; // Assuming user is authenticated

    if (!approverEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update the request status in Microsoft List
    await msListService.approveNewHireRequest(id, approverEmail);

    // Send confirmation email to the requester
    const request = await msListService.getNewHireRequestById(id);
    if (request && request.PersonalEmail) {
      const subject = 'Your New Hire Request Has Been Approved';
      const content = `
        <h2>Request Approved</h2>
        <p>Your new hire request has been approved by ${approverEmail}.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Candidate Name:</strong> ${request.FirstName} ${request.LastName}</li>
          <li><strong>Position:</strong> ${request.Position}</li>
          <li><strong>Approved By:</strong> ${approverEmail}</li>
          <li><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
      `;
      await msListService.sendEmail([request.PersonalEmail], subject, content);
    }

    res.json({ success: true, message: 'Request approved successfully' });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Reject a request
router.post('/reject-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverEmail = req.user?.userDetails; // Assuming user is authenticated

    if (!approverEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update the request status in Microsoft List
    await msListService.rejectNewHireRequest(id, approverEmail, reason);

    // Send rejection email to the requester
    const request = await msListService.getNewHireRequestById(id);
    if (request && request.PersonalEmail) {
      const subject = 'Your New Hire Request Has Been Rejected';
      const content = `
        <h2>Request Rejected</h2>
        <p>Your new hire request has been rejected by ${approverEmail}.</p>
        <h3>Request Details:</h3>
        <ul>
          <li><strong>Candidate Name:</strong> ${request.FirstName} ${request.LastName}</li>
          <li><strong>Position:</strong> ${request.Position}</li>
          <li><strong>Rejected By:</strong> ${approverEmail}</li>
          <li><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</li>
          <li><strong>Reason:</strong> ${reason || 'No reason provided'}</li>
        </ul>
      `;
      await msListService.sendEmail([request.PersonalEmail], subject, content);
    }

    res.json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router; 