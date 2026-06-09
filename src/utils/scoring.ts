import { Roommate, RoommateReview } from "../types";

export function getAverageRating(reviews?: RoommateReview[]) {
  if (!reviews || reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  return total / reviews.length;
}

export function calculateReputationScore(roommate: Roommate) {
  const averageRating = getAverageRating(roommate.reviews);

  if (averageRating === null) return null;

  return Math.round((averageRating / 5) * 100);
}

export function getReputationLabel(score: number | null) {
  if (score === null) return "Chưa có điểm";
  if (score >= 85) return `${score}% Rất tốt`;
  if (score >= 70) return `${score}% Tốt`;
  if (score >= 55) return `${score}% Ổn`;
  return `${score}% Cần cân nhắc`;
}
