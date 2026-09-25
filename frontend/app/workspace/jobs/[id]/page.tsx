import { redirect } from "next/navigation";

type WorkspaceJobPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkspaceJobPage({ params }: WorkspaceJobPageProps) {
  const { id } = await params;
  redirect(`/jobs/${encodeURIComponent(id)}`);
}
