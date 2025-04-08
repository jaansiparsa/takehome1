import type { TRPCPanelMeta } from "trpc-ui";

import { initTRPC } from "@trpc/server";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {};
};

export const t = initTRPC
  .meta<TRPCPanelMeta>()
  .context<typeof createTRPCContext>()
  .create();
