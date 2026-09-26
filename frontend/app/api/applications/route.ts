import { proxyApplicationRequest } from "@/app/api/applications/_proxy";

export async function GET(request: Request) {
  return proxyApplicationRequest(request);
}

export async function POST(request: Request) {
  return proxyApplicationRequest(request);
}