import { DatePageClient } from "@/components/date/DatePageClient";

type PageProps = {
  params: Promise<{ inviteId: string }>;
};

export default async function DatePage({ params }: PageProps) {
  const { inviteId } = await params;
  return <DatePageClient inviteId={inviteId} />;
}
