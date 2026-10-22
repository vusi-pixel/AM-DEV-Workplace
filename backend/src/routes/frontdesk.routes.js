'use strict';
const express = require('express');
const frontdeskController = require('../controllers/frontdesk.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');

const router = express.Router();
router.use(requireAuth);

router.get('/dashboard', requirePermission('frontdesk.visitors.manage'), frontdeskController.getDashboard);
router.get('/visitors', frontdeskController.getVisitors);
router.post('/visitors', requirePermission('frontdesk.visitors.manage'), frontdeskController.checkInVisitor);
router.post('/visitors/:id/checkout', requirePermission('frontdesk.visitors.manage'), frontdeskController.checkOutVisitor);

router.get('/onsite-employees', frontdeskController.getOnSiteEmployees);
router.post('/kiosk/clock-in', requirePermission('frontdesk.kiosk.checkin'), frontdeskController.kioskClockIn);

router.get('/deliveries', frontdeskController.getDeliveries);
router.post('/deliveries', requirePermission('frontdesk.deliveries.manage'), frontdeskController.logDelivery);
router.post('/deliveries/:id/collect', requirePermission('frontdesk.deliveries.manage'), frontdeskController.collectDelivery);

router.get('/muster-roll', requirePermission('frontdesk.muster.view'), frontdeskController.getEvacuationMusterList);

module.exports = router;
