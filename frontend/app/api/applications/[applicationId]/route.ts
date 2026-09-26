import { proxyApplicationRequest } from "@/app/api/applications/_proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const { applicationId } = await context.params;
  if (!/^\d+$/.test(applicationId)) {
    return Response.json({ code: "APPLICATION_NOT_FOUND" }, { status: 404 });
  }
  return proxyApplicationRequest(request, `/${applicationId}`);
}