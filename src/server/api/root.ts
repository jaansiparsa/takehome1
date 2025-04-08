import { t } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as utils from "../db/utils";
const procedure = t.procedure;

const procedureWithTime = procedure.use(({ ctx, next }) => {
  const now = new Date();

  return next({
    ctx: {
      time: now.getTime(),
      // ^ Add a field to the request context
      ...ctx,
    },
  });
});

export const appRouter = t.router({
  createUser: procedureWithTime.mutation(async ({ ctx }) => {
    const newUser = await utils.createUser();
    // ^ use the keyword `await` before all util functions as they interact with the database
    return newUser;
  }),
  createFile: procedure
    .input(
      z.object({
        asUser: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(`${input.asUser} is making this request`);
      // ^ access the input to a request

      return null;
    }),
  getFile: procedure
    .input(
      z.object({
        asUser: z.string(),
        fileId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return null;
    }),
  moveFile: procedure
    .input(
      z.object({
        asUser: z.string(),
        fileId: z.string(),
        toFolderId: z
          .string()
          .nullable()
          .describe(
            "Folder to move the file into. Set to null to make the file have no folder",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return null;
    }),
  shareFile: procedure
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        fileId: z.string(),
        toUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return null;
    }),
  createFolder: procedure
    .input(
      z.object({
        asUser: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return null;
    }),
  moveFolder: procedure
    .input(
      z.object({
        folderId: z.string(),
        toFolderId: z
          .string()
          .nullable()
          .describe(
            "Folder to move the file into. Set to null to make the file have no folder",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return null;
    }),
  shareFolder: procedure
    .input(
      z.object({
        folderId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return null;
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
