import { sqliteTableCreator } from "drizzle-orm/sqlite-core";
import { v7 as randomUUIDv7 } from "uuid";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `${name}`);

export const user = createTable("user", (d) => ({
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  files: d.text({ mode: "json" }).notNull().$type<string[]>().default([]),
  folders: d.text({ mode: "json" }).notNull().$type<string[]>().default([]),
}));

export const folder = createTable("folder", (d) => ({
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: d.text("name"),
  parentFolder: d.text("parent_folder"),
  files: d.text({ mode: "json" }).notNull().$type<string[]>().default([]),
  folders: d.text({ mode: "json" }).notNull().$type<string[]>().default([]),
  users: d.text({ mode: "json" }).$type<string[]>().default([]),
}));

export const file = createTable("file", (d) => ({
  id: d
    .text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: d.text("name"),
  contents: d.text("contents"),
  parentFolder: d.text("parent_folder"),
  users: d.text({ mode: "json" }).notNull().$type<string[]>().default([]),
}));
