import ResultView from "../result-view";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <ResultView publicId={publicId} />;
}
