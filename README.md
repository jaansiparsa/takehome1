# Givefront Take Home Interview

## Overview

The purpose of this interview is to assess your ability to pick up some basic skill with a language you may never have used before (TypeScript) and to come up with *a* solution to an ambiguous problem. If at any point in time you are confused or if you have any issues with setup, please email `aidan@givefront.com` with the heading `Givefront Interview` and I will get back to you as soon as I can. When you are finished, please share your solution code with the github username `aidansunbury`.

As this is an unbounded task that has no correct solution, we don't want you fussing over the details for hours on end. Try and spend `1-3` hours on this task, depending on your interest, course load, and prior knowledge of TypeScript. It is fine if you do not finish the entire task, so long as you have thought about possible approaches to the task and can walk us through your thought process. None of the things we are asking you to do in TypeScript are that complex, so please do ask ChatGPT, "explain how I would write this python code in TypeScript" or "what is this TypeScript Error." 

## Setup

Fork the repository and clone it to your local machine.

Install [bun](https://bun.sh/) and [nodejs](https://nodejs.org/en/download).

Install the project dependencies
```sh
bun install
```

Create a local sqlite database file called `db.sqlite` at the root of the project, either manually or with this command on mac
```sh
touch db.sqlite
```

Push the database schema onto your database
```sh
bun db:push
```

Now there are two relevant things you may want to view.

To inspect the contents of your database, run
```sh
bun db:studio
```
and visit the provided url. This will allow you to manually view and edit data for testing and debugging purposes.

To actually run your procedures, start the local dev server
```sh
bun dev
```

And visit the provided testing UI at [http://localhost:3000/api/panel](http://localhost:3000/api/panel)


## Task
Your goal is to implement the a permissions system for a *very* simplified google drive clone. We don't really care about reading from and writing to files, but more so if the user is *allowed* to access, move, or share a file. There is no concept of a "viewer" or "editor." A user either has full access to a file or folder, or no access at all. If a user has been shared a folder, they should be able to access all of the folders and files nested beneath it.

Implement the following procedures inside `src/server/api/root.ts`

1. Create File
2. Get File
3. Move File
4. Share File
5. Create Folder
6. Move Folder
7. Share Folder

To do so, there are three data models you can manipulate:

```jsonc
// User Model
{
  "id": "550e8400-e29b-41d4-a716-446655440000", // UUID v7 (auto-generated)
  "files": [], 
  "folders": [] 
}

// Folder Model
{
  "id": "550e8400-e29b-41d4-a716-446655440001", // UUID v7 (auto-generated)
  "name": "Documents", // Optional folder name
  "parentFolder": "550e8400-e29b-41d4-a716-446655440002", // Optional parent folder ID
  "files": [], 
  "folders": [], 
  "users": [] 
}

// File Model
{
  "id": "550e8400-e29b-41d4-a716-446655440003", // UUID v7 (auto-generated)
  "name": "example.txt", // Optional file name
  "contents": "This is the content of the file", // Optional file contents
  "parentFolder": "550e8400-e29b-41d4-a716-446655440001", // Optional parent folder ID
  "users": [] 
}
```

Each data model has a couple of fields that just exist to help you better identify them, but there are three "types" of fields that matter:

1. "id": This is auto generated by the database and uniquely identifies a user, folder, or file
2. "parentFolder": This is a reference to a folder id which you may optionally make user of.
3. "users", "files", "folders" arrays: These arrays are used for storing data about what users have access to what files and folders. **You do not have to use all of them to implement your system**.

There are no requirements as to how you use the provided data models. The only procedure that **needs** to return something is the `getFile`. The other procedures will be considered correct if they result `getFile` properly allowing or denying a user to access a file.

There are many edge cases and scenarios you can come up with for how file access in this system **should** work. For example:

1. User A is shared access to Folder A, Which has files B and C
2. User B moves File C out of Folder A and into Folder B, which user A does not have access to.

Should User A still be able to access the File C? The answer will depend on your implementation.

As the purpose of this interview is not for you to come up with a single correct solution, try instead to come up with a solution that makes sense to you. Be ready to answer questions about the potential tradeoffs of your solution, edge cases it might not handle yet, or ways you would have to modify it to support new functionality. **We care more about you actually understanding the code you wrote than perfectly handling every scenario or having a system completely free of bugs**.

Still, a few common sense things should be true about your system.
1. A user who creates a file or folder has access to that file or folder
2. A user who has has been shared a file should have access to that file
3. A user who has been shared a folder should have access to that folder
4. If you have access to a folder, you should be able to access all of the subfolder and files within those sub folders.
5. If a user has never had access to a file or folder, they should not be able to perform any operations on it (retrieving it, sharing it, moving from it or moving to it)

If an operation is not allowed, return the following error:
```ts
throw new TRPCError({
    code: "FORBIDDEN",
    message: "Operation not allowed", // You can provide something more descriptive here if you like
});
```

We are not going to worry about creating an actually secure login system. Instead, each request has an `asUser` input, which will represent the user making the request. The request going through or being blocked should depend on the permissions of the user id passed in the `asUser` property.

How you handle the changing of permissions as files are moved between folders is up to you. However, if a user has been directly shared a file, they should not lose access to it. Also, if a user has been directly shared a folder, they should not lose access to it if it moves. 

### Utils
You will manipulate the data in the database by calling the utility functions provided in `src/server/db/utils.ts`. Each util only manipulates one field on on entity. For example, the `setFileParentFolder` function only manipulates the `parentFolder` field on a given file, and does not manipulate any folders.

To call a utility, you must use the `await` keyword, as all of the utilities interact with your local database file. They should execute nearly instantly, but the `await` keyword simply ensures we wait for the utility to finish executing before moving on the rest of the program.

```ts
const newUser = await utils.createUser();
```

You may edit the utils if you want, but you should not have to and it is not recommended. The purpose of the utils is to abstract away the complexity of directly interfacing with the database, which you are not expected to know how to do. You may also write new utility functions that combine existing utils. The only file you should have to edit is `root.ts`. Edit other files at your own peril.

### Middlewares
For a good permissions system, you should not have to rewrite your permissions logic from scratch every time. Take a look at the `procedureWithTime` middleware. It runs **before** the `createUser` procedure, and also modifies the request through `context`. Think about what the `moveFile` and `shareFile` procedures will both need to do. They both need to first check if the user has access to the file, and then modify some stored data in the database. Is there a way you could use middlewares to avoid repeating the same logic to check if hte user has access to the file?
