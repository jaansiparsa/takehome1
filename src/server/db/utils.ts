import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { file, folder, user } from "./schema";

/**
 * Creates a new user in the database
 * @param id - Optional user ID. If not provided, a UUID will be auto-generated
 * @returns The newly created user object
 * @throws {TRPCError} If user creation fails
 */
export async function createUser(id?: string) {
  const [newUser] = await db
    .insert(user)
    .values({
      id,
    })
    .returning();
  if (!newUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: user not created",
    });
  }
  return newUser;
}

/**
 * Retrieves a user by their ID
 * @param userId - The ID of the user to retrieve
 * @returns The user object if found, undefined otherwise
 */
export async function getUser(userId: string) {
  const [requestedUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId));
  return requestedUser;
}

/**
 * Adds a folder to a user's folders list
 * @param userId - The ID of the user
 * @param folderId - The ID of the folder to add
 * @returns The updated user object
 * @throws {TRPCError} If the user is not found or update fails
 */
export async function addToUserFolders(userId: string, folderId: string) {
  const requestedUser = await getUser(userId);
  if (!requestedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: user not found",
    });
  }
  const [updatedUser] = await db
    .update(user)
    .set({
      folders: [...requestedUser.folders, folderId],
    })
    .returning();
  if (!updatedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: user not updated",
    });
  }
  return updatedUser;
}

/**
 * Removes a folder from a user's folders list
 * @param userId - The ID of the user
 * @param folderId - The ID of the folder to remove
 * @returns The updated user object
 */
export async function removeFromUserFolders(userId: string, folderId: string) {
  const requestedUser = await getUser(userId);
  if (!requestedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: user not found",
    });
  }
  const [updatedUser] = await db
    .update(user)
    .set({
      folders: requestedUser.folders.filter((id) => id !== folderId),
    })
    .where(eq(user.id, userId))
    .returning();
  if (!updatedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: user not updated",
    });
  }
  return updatedUser;
}

/**
 * Adds a file to a user's files list
 * @param userId - The ID of the user
 * @param fileId - The ID of the file to add
 * @returns The updated user object
 */
export async function addToUserFiles(userId: string, fileId: string) {
  const requestedUser = await getUser(userId);
  if (!requestedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: user not found",
    });
  }
  const [updatedUser] = await db
    .update(user)
    .set({
      files: [...requestedUser.files, fileId],
    })
    .where(eq(user.id, userId))
    .returning();
  if (!updatedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: user not updated",
    });
  }
  return updatedUser;
}

/**
 * Removes a file from a user's files list
 * @param userId - The ID of the user
 * @param fileId - The ID of the file to remove
 * @returns The updated user object
 */
export async function removeFromUserFiles(userId: string, fileId: string) {
  const requestedUser = await getUser(userId);
  if (!requestedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: user not found",
    });
  }
  const [updatedUser] = await db
    .update(user)
    .set({
      files: requestedUser.files.filter((id) => id !== fileId),
    })
    .where(eq(user.id, userId))
    .returning();
  if (!updatedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: user not updated",
    });
  }
  return updatedUser;
}

/**
 * Retrieves all users from the database
 * @returns Array of all user objects
 */
export async function getAllUsers() {
  const allUsers = await db.select().from(user);
  return allUsers;
}

/**
 * Creates a new file in the database
 * @param params - Optional file parameters
 * @param params.name - Optional file name
 * @param params.contents - Optional file contents
 * @returns The newly created file object
 * @throws {TRPCError} If file creation fails
 */
export async function createFile(params?: {
  name?: string;
  contents?: string;
}) {
  const [newFile] = await db
    .insert(file)
    .values({
      name: params?.name,
      contents: params?.contents,
    })
    .returning();
  if (!newFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: file not created",
    });
  }
  return newFile;
}

/**
 * Retrieves a file by its ID
 * @param fileId - The ID of the file to retrieve
 * @returns The file object if found, undefined otherwise
 */
export async function getFile(fileId: string) {
  const [requestedFile] = await db
    .select()
    .from(file)
    .where(eq(file.id, fileId));
  return requestedFile;
}

/**
 * Sets the parent folder for a file
 * @param fileId - The ID of the file
 * @param parentFolderId - The ID of the parent folder (or null to remove parent)
 * @returns The updated file object
 * @throws {TRPCError} If the file is not found or update fails
 */
export async function setFileParentFolder(
  fileId: string,
  parentFolderId: string | null,
) {
  const requestedFile = await getFile(fileId);
  if (!requestedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: file not found",
    });
  }
  const [updatedFile] = await db
    .update(file)
    .set({
      parentFolder: parentFolderId,
    })
    .where(eq(file.id, fileId))
    .returning();
  if (!updatedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: file not updated",
    });
  }
  return updatedFile;
}

/**
 * Adds a user to a file's users list
 * @param fileId - The ID of the file
 * @param userId - The ID of the user to add
 * @returns The updated file object
 * @throws {TRPCError} If the file is not found or update fails
 */
export async function addToFileUsers(fileId: string, userId: string) {
  const requestedFile = await getFile(fileId);
  if (!requestedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: file not found",
    });
  }
  const [updatedFile] = await db
    .update(file)
    .set({
      users: [...requestedFile.users, userId],
    })
    .where(eq(file.id, fileId))
    .returning();
  if (!updatedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: file not updated",
    });
  }
  return updatedFile;
}

/**
 * Removes a user from a file's users list
 * @param fileId - The ID of the file
 * @param userId - The ID of the user to remove
 * @returns The updated file object
 * @throws {TRPCError} If the file is not found or update fails
 */
export async function removeFromFileUsers(fileId: string, userId: string) {
  const requestedFile = await getFile(fileId);
  if (!requestedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: file not found",
    });
  }
  const [updatedFile] = await db
    .update(file)
    .set({
      users: requestedFile.users.filter((id) => id !== userId),
    })
    .where(eq(file.id, fileId))
    .returning();
  if (!updatedFile) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: file not updated",
    });
  }
  return updatedFile;
}

/**
 * Retrieves all files from the database
 * @returns Array of all file objects
 */
export async function getFiles() {
  const allFiles = await db.select().from(file);
  return allFiles;
}

/**
 * Creates a new folder in the database
 * @param params - Optional folder parameters
 * @param params.id - Optional folder ID. If not provided, a UUID will be auto-generated
 * @param params.name - Optional folder name
 * @returns The newly created folder object
 * @throws {TRPCError} If folder creation fails
 */
export async function createFolder(params?: {
  name?: string;
  parentFolder?: string;
}) {
  const [newFolder] = await db
    .insert(folder)
    .values({
      name: params?.name,
      parentFolder: params?.parentFolder,
    })
    .returning();
  if (!newFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not created",
    });
  }
  return newFolder;
}

/**
 * Retrieves a folder by its ID
 * @param folderId - The ID of the folder to retrieve
 * @returns The folder object if found, undefined otherwise
 */
export async function getFolder(folderId: string) {
  const [requestedFolder] = await db
    .select()
    .from(folder)
    .where(eq(folder.id, folderId));
  return requestedFolder;
}

/**
 * Sets the parent folder for a folder
 * @param folderId - The ID of the folder
 * @param parentFolderId - The ID of the parent folder (or null to remove parent)
 * @returns The updated folder object
 * @throws {TRPCError} If the folder is not found or update fails
 */
export async function setFolderParentFolder(
  folderId: string,
  parentFolderId: string | null,
) {
  const requestedFolder = await getFolder(folderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      parentFolder: parentFolderId,
    })
    .where(eq(folder.id, folderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Adds a user to a folder's users list
 * @param folderId - The ID of the folder
 * @param userId - The ID of the user to add
 * @returns The updated folder object
 * @throws {TRPCError} If the folder is not found or update fails
 */
export async function addToFolderUsers(folderId: string, userId: string) {
  const requestedFolder = await getFolder(folderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      users: [...(requestedFolder.users || []), userId],
    })
    .where(eq(folder.id, folderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Removes a user from a folder's users list
 * @param folderId - The ID of the folder
 * @param userId - The ID of the user to remove
 * @returns The updated folder object
 * @throws {TRPCError} If the folder is not found or update fails
 */
export async function removeFromFolderUsers(folderId: string, userId: string) {
  const requestedFolder = await getFolder(folderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      users: (requestedFolder.users || []).filter((id) => id !== userId),
    })
    .where(eq(folder.id, folderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Adds a file to a folder's files list
 * @param folderId - The ID of the folder
 * @param fileId - The ID of the file to add
 * @returns The updated folder object
 * @throws {TRPCError} If the folder is not found or update fails
 */
export async function addToFolderFiles(folderId: string, fileId: string) {
  const requestedFolder = await getFolder(folderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      files: [...requestedFolder.files, fileId],
    })
    .where(eq(folder.id, folderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Removes a file from a folder's files list
 * @param folderId - The ID of the folder
 * @param fileId - The ID of the file to remove
 * @returns The updated folder object
 * @throws {TRPCError} If the folder is not found or update fails
 */
export async function removeFromFolderFiles(folderId: string, fileId: string) {
  const requestedFolder = await getFolder(folderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      files: requestedFolder.files.filter((id) => id !== fileId),
    })
    .where(eq(folder.id, folderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Adds a subfolder to a folder's folders list
 * @param parentFolderId - The ID of the parent folder
 * @param subFolderId - The ID of the subfolder to add
 * @returns The updated parent folder object
 * @throws {TRPCError} If the parent folder is not found or update fails
 */
export async function addToFolderFolders(
  parentFolderId: string,
  subFolderId: string,
) {
  const requestedFolder = await getFolder(parentFolderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      folders: [...requestedFolder.folders, subFolderId],
    })
    .where(eq(folder.id, parentFolderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Removes a subfolder from a folder's folders list
 * @param parentFolderId - The ID of the parent folder
 * @param subFolderId - The ID of the subfolder to remove
 * @returns The updated parent folder object
 * @throws {TRPCError} If the parent folder is not found or update fails
 */
export async function removeFromFolderFolders(
  parentFolderId: string,
  subFolderId: string,
) {
  const requestedFolder = await getFolder(parentFolderId);
  if (!requestedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unhandled Error: folder not found",
    });
  }
  const [updatedFolder] = await db
    .update(folder)
    .set({
      folders: requestedFolder.folders.filter((id) => id !== subFolderId),
    })
    .where(eq(folder.id, parentFolderId))
    .returning();
  if (!updatedFolder) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database error: folder not updated",
    });
  }
  return updatedFolder;
}

/**
 * Retrieves all folders from the database
 * @returns Array of all folder objects
 */
export async function getAllFolders() {
  const allFolders = await db.select().from(folder);
  return allFolders;
}

/**
 * Retrieves all files from the database
 * @returns Array of file objects
 */
export async function getAllFiles() {
  return await db.select().from(file);
}
