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
      ...ctx,
    },
  });
});

async function hasFileAccess(userId: string, fileId: string): Promise<boolean> {
  const file = await utils.getFile(fileId);
  if (!file) return false;
  
  if (file.users.includes(userId)) return true;
  
  // recursively check parent access
  if (file.parentFolder) {
    return await hasFolderAccess(userId, file.parentFolder);
  }
  
  return false;
}

async function hasFolderAccess(userId: string, folderId: string): Promise<boolean> {
  const folder = await utils.getFolder(folderId);
  if (!folder) return false;
  
  if (folder.users && folder.users.includes(userId)) return true;
  
  // recursively check parent access
  if (folder.parentFolder) {
    return await hasFolderAccess(userId, folder.parentFolder);
  }
  
  return false;
}

const withFileAccess = procedure
  .input(
    z.object({
      asUser: z.string().describe("The user initiating the request"),
      fileId: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const file = await utils.getFile(input.fileId);
    if (!file) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    const hasAccess = await hasFileAccess(input.asUser, input.fileId);
    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Operation not allowed",
      });
    }

    return next({
      ctx: {
        ...ctx,
        file,
        user: input.asUser,
      },
    });
  });


  const withFolderAccess = procedure
  .input(
    z.object({
      asUser: z.string().describe("The user initiating the request"),
      folderId: z.string(),
    })
  )
  .use(async ({ ctx, input, next }) => {
    const folder = await utils.getFolder(input.folderId);
    if (!folder) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Folder not found",
      });
    }

    const hasAccess = await hasFolderAccess(input.asUser, input.folderId);
    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Operation not allowed",
      });
    }

    return next({
      ctx: {
        ...ctx,
        folder,
        user: input.asUser,
      },
    });
  });

export const appRouter = t.router({
  createUser: procedureWithTime
    .input(
      z.object({
        userId: z
          .string()
          .optional()
          .describe(
            "Optionally provide a user id so you can better identify the user",
          ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newUser = await utils.createUser(input.userId);
      return {
        user: newUser,
        calledAt: ctx.time,
      };
    }),
    
  getAllUsers: procedure.query(async () => {
    return await utils.getAllUsers();
  }),
  
  // File operations
  createFile: procedure
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        name: z.string().optional(),
        contents: z.string().optional(),
        parentFolder: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // If parent folder specified, check access
      if (input.parentFolder) {
        const hasAccess = await hasFolderAccess(input.asUser, input.parentFolder);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Operation not allowed",
          });
        }
      }
      
      const file = await utils.createFile({
        name: input.name,
        contents: input.contents,
      });
      
      if (input.parentFolder) {
        await utils.setFileParentFolder(file.id, input.parentFolder);
        await utils.addToFolderFiles(input.parentFolder, file.id);
      }
      
      // giving access to asUser
      await utils.addToFileUsers(file.id, input.asUser);
      
      return file;
    }),
    
  getFile: withFileAccess.query(async ({ ctx }) => {
    // access already verified by middleware
    return ctx.file;
  }),
  
  moveFile: withFileAccess
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        fileId: z.string(),
        toFolderId: z.string().nullable().describe(
          "Folder to move the file into. Set to null to make the file have no folder"
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check destination folder access if not null
      if (input.toFolderId) {
        const hasDestAccess = await hasFolderAccess(input.asUser, input.toFolderId);
        if (!hasDestAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Operation not allowed",
          });
        }
      }
      
      const oldParentFolder = ctx.file.parentFolder;
      await utils.setFileParentFolder(input.fileId, input.toFolderId);
      if (oldParentFolder) {
        await utils.removeFromFolderFiles(oldParentFolder, input.fileId);
      }
      
      if (input.toFolderId) {
        await utils.addToFolderFiles(input.toFolderId, input.fileId);
      }
      
      return { success: true };
    }),
    
  shareFile: withFileAccess
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        fileId: z.string(),
        toUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await utils.addToFileUsers(input.fileId, input.toUserId);
      return { success: true };
    }),
  
  // Folder operations
  createFolder: procedure
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        name: z.string().optional(),
        parentFolder: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.parentFolder) {
        const hasAccess = await hasFolderAccess(input.asUser, input.parentFolder);
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Operation not allowed",
          });
        }
      }
      
      const folder = await utils.createFolder({
        name: input.name,
        parentFolder: input.parentFolder,
      });
      
      if (input.parentFolder) {
        await utils.addToFolderFolders(input.parentFolder, folder.id);
      }
      // giving access to asUser
      await utils.addToFolderUsers(folder.id, input.asUser);
      
      return folder;
    }),
    
  moveFolder: withFolderAccess
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        folderId: z.string(),
        toFolderId: z.string().nullable().describe(
          "Folder to move the folder into. Set to null to make the folder have no parent"
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // edge case: can't move a folder into itself
      if (input.folderId === input.toFolderId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move folder into itself",
        });
      }
      
      // Check if destination would create a circular reference
      if (input.toFolderId) {
        let currentFolder = await utils.getFolder(input.toFolderId);
        while (currentFolder && currentFolder.parentFolder) {
          if (currentFolder.parentFolder === input.folderId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot create circular folder reference",
            });
          }
          currentFolder = await utils.getFolder(currentFolder.parentFolder);
        }
        
        // see if user has access to move folder
        const hasDestAccess = await hasFolderAccess(input.asUser, input.toFolderId);
        if (!hasDestAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Operation not allowed",
          });
        }
      }
      
      const oldParentFolder = ctx.folder.parentFolder;
      await utils.setFolderParentFolder(input.folderId, input.toFolderId);
      if (oldParentFolder) {
        await utils.removeFromFolderFolders(oldParentFolder, input.folderId);
      }
      if (input.toFolderId) {
        await utils.addToFolderFolders(input.toFolderId, input.folderId);
      }
      
      return { success: true };
    }),
    
  shareFolder: withFolderAccess
    .input(
      z.object({
        asUser: z.string().describe("The user initiating the request"),
        folderId: z.string(),
        toUserId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Access already verified by middleware
      
      // recursively share folder and its contents
      async function shareRecursively(folderId: string) {
        // Add user to folder
        await utils.addToFolderUsers(folderId, input.toUserId);
        
        const folder = await utils.getFolder(folderId);
        if (folder) {
          for (const fileId of folder.files) {
            await utils.addToFileUsers(fileId, input.toUserId);
          }
        }

        // recursively share all subfolders
        if (folder) {
          for (const subFolderId of folder.folders) {
            await shareRecursively(subFolderId);
          }
}
      }
      
      await shareRecursively(input.folderId);
      
      return { success: true };
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
});

// export type definition of API
export type AppRouter = typeof appRouter;
