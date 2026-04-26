const prisma = require('../config/db');

const getAllRfqs = async () => {
  const rfqs = await prisma.rFQ.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bids: {
        orderBy: { totalAmount: 'asc' },
        take: 1
      }
    }
  });

  const now = new Date();
  return rfqs.map((rfq) => {
    let status = rfq.status;
    if (status !== 'FORCE_CLOSED' && status !== 'CLOSED') {
      if (now > rfq.forcedCloseTime) {
        status = 'FORCE_CLOSED';
      } else if (now > rfq.endTime) {
        status = 'CLOSED';
      }
    }
    return { ...rfq, status };
  });
};

const getRfqById = async (id) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      bids: {
        include: { supplier: true },
        orderBy: { rank: 'asc' }
      },
      logs: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });
  
  if (!rfq) return null;

  let status = rfq.status;
  const now = new Date();
  if (status !== 'FORCE_CLOSED' && status !== 'CLOSED') {
    if (now > rfq.forcedCloseTime) {
      status = 'FORCE_CLOSED';
    } else if (now > rfq.endTime) {
      status = 'CLOSED';
    }
  }

  return { ...rfq, status };
};

const createRfq = async (data) => {
  const {
    name,
    startTime,
    endTime,
    forcedCloseTime,
    serviceDate,
    triggerWindowMins,
    extensionDurationMins,
    extensionType
  } = data;

  const parsedStartTime = new Date(startTime);
  const parsedEndTime = new Date(endTime);
  const parsedForcedCloseTime = new Date(forcedCloseTime);
  const parsedServiceDate = new Date(serviceDate);

  if (parsedForcedCloseTime <= parsedEndTime) {
    throw new Error('Forced Close Time must be greater than Bid Close Time');
  }

  const referenceId = `RFQ-${Math.floor(1000 + Math.random() * 9000)}`;

  const rfq = await prisma.rFQ.create({
    data: {
      referenceId,
      name,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      forcedCloseTime: parsedForcedCloseTime,
      serviceDate: parsedServiceDate,
      triggerWindowMins: parseInt(triggerWindowMins),
      extensionDurationMins: parseInt(extensionDurationMins),
      extensionType,
      status: 'ACTIVE'
    }
  });

  return rfq;
};

const submitBid = async (rfqId, data) => {
  const { supplierName, carrierName, freightCharges, originCharges, destinationCharges, transitTime, quoteValidity } = data;

  const totalAmount = parseFloat(freightCharges) + parseFloat(originCharges) + parseFloat(destinationCharges);

  if (totalAmount <= 0 || isNaN(totalAmount)) {
    throw new Error('Total Amount must be a valid number greater than 0');
  }

  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      bids: { orderBy: { totalAmount: 'asc' } }
    }
  });

  if (!rfq) {
    throw new Error('RFQ not found');
  }

  const parsedQuoteValidity = new Date(quoteValidity);
  
  // Normalize both dates to the start of the day (00:00:00) for accurate date-only comparison
  const validityDateOnly = new Date(parsedQuoteValidity);
  validityDateOnly.setHours(0, 0, 0, 0);
  
  const serviceDateOnly = new Date(rfq.serviceDate);
  serviceDateOnly.setHours(0, 0, 0, 0);

  if (validityDateOnly < serviceDateOnly) {
    throw new Error('Quote Validity Date must be greater than or equal to the Service Date');
  }

  const now = new Date();
  if (now > rfq.forcedCloseTime || now > rfq.endTime || rfq.status !== 'ACTIVE') {
    throw new Error('Auction is closed');
  }

  // Upsert Supplier
  let supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
  if (!supplier) {
    supplier = await prisma.supplier.create({ data: { name: supplierName } });
  }

  // Capture Previous Ranks
  const previousRanks = new Map();
  const previousL1 = rfq.bids.length > 0 ? rfq.bids[0].supplierId : null;
  
  rfq.bids.forEach((b, index) => {
    previousRanks.set(b.supplierId, index + 1);
  });

  // Save Bid
  const bid = await prisma.bid.create({
    data: {
      rfqId: rfq.id,
      supplierId: supplier.id,
      carrierName,
      freightCharges: parseFloat(freightCharges),
      originCharges: parseFloat(originCharges),
      destinationCharges: parseFloat(destinationCharges),
      totalAmount,
      transitTime,
      quoteValidity: parsedQuoteValidity
    }
  });

  // Recalculate Ranks
  const allBids = await prisma.bid.findMany({
    where: { rfqId: rfq.id },
    orderBy: { totalAmount: 'asc' }
  });

  const newRanks = new Map();
  const newL1 = allBids.length > 0 ? allBids[0].supplierId : null;

  for (let i = 0; i < allBids.length; i++) {
    const b = allBids[i];
    const rank = i + 1;
    newRanks.set(b.supplierId, rank);
    await prisma.bid.update({
      where: { id: b.id },
      data: { rank }
    });
  }

  // Evaluate Extension Engine
  const timeRemainingMs = rfq.endTime.getTime() - now.getTime();
  const triggerWindowMs = rfq.triggerWindowMins * 60 * 1000;

  if (timeRemainingMs <= triggerWindowMs && timeRemainingMs > 0) {
    let extend = false;
    let reason = '';

    if (rfq.extensionType === 'ANY_BID') {
      extend = true;
      reason = 'Bid received within trigger window.';
    } else if (rfq.extensionType === 'ANY_RANK') {
      for (const [supId, newRank] of newRanks.entries()) {
        if (previousRanks.get(supId) !== newRank) {
          extend = true;
          reason = 'Supplier rank changed within trigger window.';
          break;
        }
      }
    } else if (rfq.extensionType === 'L1_RANK') {
      if (previousL1 !== newL1) {
        extend = true;
        reason = 'L1 rank changed within trigger window.';
      }
    }

    if (extend) {
      const newEndTime = new Date(rfq.endTime.getTime() + rfq.extensionDurationMins * 60 * 1000);
      const finalEndTime = newEndTime > rfq.forcedCloseTime ? rfq.forcedCloseTime : newEndTime;

      if (rfq.endTime.getTime() !== finalEndTime.getTime()) {
        await prisma.rFQ.update({
          where: { id: rfq.id },
          data: { endTime: finalEndTime }
        });

        await prisma.auctionLog.create({
          data: {
            rfqId: rfq.id,
            eventType: 'EXTENSION_TRIGGERED',
            description: `Auction extended by ${rfq.extensionDurationMins} minutes. Reason: ${reason}. New End Time: ${finalEndTime.toISOString()}`
          }
        });
      }
    }
  }

  await prisma.auctionLog.create({
    data: {
      rfqId: rfq.id,
      eventType: 'BID_SUBMITTED',
      description: `Bid submitted by ${supplier.name} for ${totalAmount}`
    }
  });

  return bid;
};

module.exports = {
  getAllRfqs,
  getRfqById,
  createRfq,
  submitBid
};
