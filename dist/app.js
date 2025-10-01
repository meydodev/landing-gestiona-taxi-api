"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const downloadCounterRoutes_1 = __importDefault(require("./routes/downloadCounterRoutes"));
const reviewsRoutes_1 = __importDefault(require("./routes/reviewsRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
const corsOptions = {
    origin: [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'https://gestionataxi.es',
        'https://www.gestionataxi.es',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.use('/api/downloadsCounter', downloadCounterRoutes_1.default);
app.use('/api/reviews', reviewsRoutes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
