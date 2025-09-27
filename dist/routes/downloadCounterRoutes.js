"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const downloadCounterController_1 = require("../controllers/downloadCounterController");
const router = (0, express_1.Router)();
router.get('/', downloadCounterController_1.getDownloadCounters);
router.post('/', downloadCounterController_1.addDownload);
exports.default = router;
