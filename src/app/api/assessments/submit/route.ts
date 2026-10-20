import { DatabaseConfigurationError } from "@/lib/db/neon";
import { saveAssessmentResult } from "@/lib/db/assessment-results";
import { AssessmentSubmissionError, submitAssessment } from "@/lib/results/submit-assessment";

const MAX_BODY_LENGTH = 16_384;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_LENGTH) {
    return Response.json(
      { error: { code: "request_too_large", message: "The submission is too large." } },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_LENGTH) {
      return Response.json(
        { error: { code: "request_too_large", message: "The submission is too large." } },
        { status: 413 },
      );
    }
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { error: { code: "invalid_json", message: "The request body must be valid JSON." } },
      { status: 400 },
    );
  }

  try {
    const result = await submitAssessment(body, saveAssessmentResult);
    return Response.json(
      { result, sharePath: `/results/${result.publicId}` },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AssessmentSubmissionError) {
      return Response.json(
        { error: { code: "invalid_submission", message: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof DatabaseConfigurationError) {
      return Response.json(
        { error: { code: "storage_unavailable", message: "Result storage is not configured yet." } },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("Assessment submission could not be saved.", error);
    return Response.json(
      { error: { code: "storage_error", message: "We could not save your result. Please try again." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
