import { SessionPageClient } from "@/components/SessionPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  return <SessionPageClient sessionId={id} />;
}
