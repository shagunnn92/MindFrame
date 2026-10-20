import { DatabaseConfigurationError } from "@/lib/db/neon";
import { findPublicAssessmentResult } from "@/lib/db/assessment-results";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  if (!UUID_PATTERN.test(publicId)) {
    return Response.json(
      { error: { code: "not_found", message: "This result could not be found." } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await findPublicAssessmentResult(publicId);
    if (!result) {
      return Response.json(
        { error: { code: "not_found", message: "This result could not be found." } },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return Response.json(
        { error: { code: "storage_unavailable", message: "Result storage is not configured yet." } },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("Public assessment result could not be loaded.", error);
    return Response.json(
      { error: { code: "storage_error", message: "This result is temporarily unavailable." } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
