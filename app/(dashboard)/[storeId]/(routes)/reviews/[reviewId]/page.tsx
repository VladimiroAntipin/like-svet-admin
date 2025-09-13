import prismadb from "@/lib/prismadb";
import { ReviewForm } from "./components/review-form";
import { ObjectId } from "mongodb";

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReviewPage = async ({ params }: any) => {
  const resolvedParams = await params;
  if (resolvedParams.reviewId === "new") {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <ReviewForm initialData={null} />
        </div>
      </div>
    );
  }

  if (!ObjectId.isValid(resolvedParams.reviewId)) {
    return <div>Невалидный ID-отзыва</div>;
  }

  const review = await prismadb.review.findUnique({
    where: {
      id: resolvedParams.reviewId
    }
  });

  if (!review) {
    return <div>Нет отзывов</div>;
  }
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReviewForm initialData={review} />
      </div>
    </div>
  );
}

export default ReviewPage;