"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = getReviews;
exports.addReview = addReview;
exports.getReviewsStats = getReviewsStats;
const reviews_1 = require("../models/reviews");
const reviews_2 = require("../models/reviews");
async function getReviews(req, res, next) {
    try {
        const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
        const limit = Math.max(1, parseInt(String(req.query.limit ?? '9'), 10));
        const all = await (0, reviews_1.listReviews)();
        const total = all.length;
        const start = (page - 1) * limit;
        const items = all.slice(start, start + limit);
        // respuesta paginada
        res.json({
            items,
            page,
            limit,
            total,
            hasMore: start + items.length < total,
        });
    }
    catch (err) {
        next(err);
    }
}
async function addReview(req, res, next) {
    try {
        //console.log('[SERVER BODY]', req.body); // debe mostrar { rating: 5, review: '...' }
        const { rating, review } = req.body ?? {};
        if (typeof rating !== 'number' || rating < 1 || rating > 5)
            return res.status(400).json({ message: 'rating 1..5' });
        if (typeof review !== 'string' || review.trim().length < 3)
            return res.status(400).json({ message: 'review ≥ 3 chars' });
        const saved = await (0, reviews_1.createReviewTx)({ rating, review });
        res.status(201).json(saved);
    }
    catch (e) {
        next(e);
    }
}
async function getReviewsStats(_req, res, next) {
    try {
        const stats = await (0, reviews_2.getReviewStats)();
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
}
