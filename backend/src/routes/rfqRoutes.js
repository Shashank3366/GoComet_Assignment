const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');

router.get('/', rfqController.getAllRfqs);
router.get('/:id', rfqController.getRfqById);
router.post('/', rfqController.createRfq);
router.post('/:id/bid', rfqController.submitBid);

module.exports = router;
