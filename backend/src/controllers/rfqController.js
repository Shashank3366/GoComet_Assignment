const rfqService = require('../services/rfqService');

const getAllRfqs = async (req, res) => {
  try {
    const rfqs = await rfqService.getAllRfqs();
    res.status(200).json(rfqs);
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
};

const getRfqById = async (req, res) => {
  try {
    const rfq = await rfqService.getRfqById(req.params.id);
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found' });
    }
    res.status(200).json(rfq);
  } catch (error) {
    console.error('Error fetching RFQ:', error);
    res.status(500).json({ error: 'Failed to fetch RFQ' });
  }
};

const createRfq = async (req, res) => {
  try {
    const rfq = await rfqService.createRfq(req.body);
    res.status(201).json(rfq);
  } catch (error) {
    console.error('Error creating RFQ:', error);
    if (error.message.includes('Forced Close Time')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to create RFQ' });
  }
};

const submitBid = async (req, res) => {
  try {
    const bid = await rfqService.submitBid(req.params.id, req.body);
    res.status(201).json(bid);
  } catch (error) {
    console.error('Error submitting bid:', error);
    const clientErrors = [
      'Total Amount must be a valid number greater than 0',
      'RFQ not found',
      'Quote Validity Date must be greater than or equal to the Service Date',
      'Auction is closed'
    ];
    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to submit bid' });
  }
};

module.exports = {
  getAllRfqs,
  getRfqById,
  createRfq,
  submitBid
};
