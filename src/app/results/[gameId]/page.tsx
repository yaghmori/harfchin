import { ResultsClient } from "@/components/results/ResultsClient";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  return <ResultsClient gameId={gameId} />;
}
