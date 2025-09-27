import { Router } from 'express';
import { getReviews, addReview } from '../controllers/reviewsController';
import { getReviewsStats } from '../controllers/reviewsController';

const router = Router();

router.get('/', getReviews);
router.get('/stats', getReviewsStats); 
router.post('/', addReview);

export default router;

