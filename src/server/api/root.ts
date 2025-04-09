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

// Middlewares can also specify inputs
const procedureWithAsUserId = procedure
  .input(
    z.object({
      asUserId: z
        .string()
        .describe("The id of the user initiating the request"),
    }),
  )
  .use(({ ctx, next }) => {
    return next(ctx);
  });

export const appRouter = t.router({
  createUser: procedureWithTime
    .input(
      z.object({
        userId: z
          .string()
          .optional()
          .describe(
            "Optionally provide a user id so you can better identify th user",
          ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newUser = await utils.createUser(input.userId);
      // ^ use the keyword `await` before all util functions as they interact with the database
      return {
        user: newUser,
        calledAt: ctx.time,
      };
      // ^ access the request context
    }),
  getAllUsers: procedure.query(async () => {
    return await utils.getAllUsers();
  }),
  getAllFiles: procedure
    .meta({
      description: "This is just here for debugging purposes",
    })
    .query(async () => {
      return await utils.getAllFiles();
    }),
  getAllFolders: procedure
    .meta({
      description: "This is just here for debugging purposes",
    })
    .query(async () => {
      return await utils.getAllFolders();
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
  getFile: procedureWithAsUserId
    .input(
      z.object({
        fileId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      console.log(input.asUserId);
      // ^ procedures can inherit inputs from their middleware
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
