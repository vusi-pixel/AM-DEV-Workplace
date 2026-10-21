'use strict';
const express = require('express');
const workModeController = require('../controllers/workMode.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const { validateBody } = require('../middleware/validate');
const { workModeRequestSchema, reviewRequestSchema, rejectRequestSchema, revokeRequestSchema } = require('../validators/workMode.validators');

const router = express.Router();
router.use(requireAuth);

router.post('/', requirePermission('hybrid.request'), validateBody(workModeRequestSchema), workModeController.submit);
router.get('/me', workModeController.getMyRequests);
router.get('/', requirePermission('hybrid.review'), workModeController.listAll);
router.post('/:id/approve', requirePermission('hybrid.review'), validateBody(reviewRequestSchema), workModeController.approve);
router.post('/:id/reject', requirePermission('hybrid.review'), validateBody(rejectRequestSchema), workModeController.reject);
router.post('/:id/revoke', requirePermission('hybrid.review'), validateBody(revokeRequestSchema), workModeController.revoke);

module.exports = router;
