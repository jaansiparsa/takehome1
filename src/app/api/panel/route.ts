import { appRouter } from "@/server/api/root";
import { NextResponse } from "next/server";
import { renderTrpcPanel } from "trpc-ui";

export async function GET() {
  return new NextResponse(
    renderTrpcPanel(appRouter, {
      url: "/api/trpc", // Default trpc route in nextjs
    }),
    {
      status: 200,
      headers: [["Content-Type", "text/html"] as [string, string]],
    },
  );
}
