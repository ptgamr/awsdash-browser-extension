import { openDB, DBSchema, IDBPDatabase, deleteDB } from "idb";
import { BucketItem } from "./types";

export interface AwsDashDB extends DBSchema {
  bucket_items: {
    key: number;
    value: BucketItem;
    indexes: {
      id: number;
      bucket: string;
      key: string;
      bucketAndKey: [string, string];
      syncTimestamp: number;
    };
  };
}

const BUCKET_ITEMS = "bucket_items";

class DBWrapper {
  db: null | IDBPDatabase<AwsDashDB> = null;
  DB_NAME = `AwsDashComS3`;
  DB_VERSION = 2;

  async connect() {
    if (!this.db) {
      this.db = await openDB<AwsDashDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          // eslint-disable-next-line no-console
          console.log(
            `idb open: oldVersion=${oldVersion}, newVersion=${newVersion}`,
          );

          //
          // When this code first executes, since the database doesn't yet exist in the browser,
          // oldVersion is 0 and the switch statement starts at case 0.
          //
          // We are deliberately not having a break statement after each case.
          //
          // This way, if the existing database is a few versions behind (or if it doesn't exist),
          // the code continues through the rest of the case blocks until it has executed all the latest changes.

          /* eslint-disable no-fallthrough */
          switch (oldVersion) {
            // @ts-expect-error (fallthrough)
            case 0: {
              const store = db.createObjectStore(BUCKET_ITEMS, {
                keyPath: "id",
                autoIncrement: true,
              });
              store.createIndex("bucket", "bucket");
              store.createIndex("key", "key");

              store.createIndex("bucketAndKey", ["bucket", "key"], {
                unique: true,
              });
              store.createIndex("syncTimestamp", "syncTimestamp");
            }

            case 1: {
            }

            // Future database migration here
            // the last "case" statement should always one version behind the specified DB_VERSION
          }
          /* eslint-enable no-fallthrough */
        },
      });
    }

    return this.db;
  }

  async destroyDatabase() {
    await deleteDB(this.DB_NAME);
    this.db = null;
  }
}

class BaseStore {
  constructor(private dbWrapper: DBWrapper) {}

  get db() {
    if (!this.dbWrapper.db) {
      throw new Error("db is not initialize!");
    }
    return this.dbWrapper.db;
  }
}

class BucketItemsStore extends BaseStore {
  async query(bucketName: string) {
    const items = (await this.db.getAllFromIndex(
      BUCKET_ITEMS,
      "bucket",
      bucketName,
    )) as BucketItem[];
    return items;
  }

  async getByBucketAndId(_bucketName: string, id: number) {
    return this.db.get(BUCKET_ITEMS, id);
  }

  async upsert(item: BucketItem) {
    const bucketAndKey = IDBKeyRange.only([item.bucket, item.key]);

    const tx = this.db.transaction(BUCKET_ITEMS, "readwrite");
    const index = tx.store.index("bucketAndKey");

    const existing = await index.get(bucketAndKey);

    if (existing) {
      await tx.store.put({ ...item, id: existing.id });
    } else {
      await tx.store.add(item);
    }

    await tx.done;

    const doc = await this.db.getFromIndex(
      BUCKET_ITEMS,
      "bucketAndKey",
      bucketAndKey,
    );
    return doc!;
  }

  async deleteNonCurrentVersion(bucketName: string, syncTimestamp: number) {
    const tx = this.db.transaction(BUCKET_ITEMS, "readwrite");
    const index = tx.store.index("bucket");

    let deletedCount = 0;

    for await (const cursor of index.iterate(bucketName)) {
      if (
        cursor.value.bucket === bucketName &&
        cursor.value.syncTimestamp !== syncTimestamp
      ) {
        await cursor.delete();
        deletedCount++;
      }
    }

    await tx.done;

    return { deletedCount };
  }

  async iterate(bucketNames: string[], callback: (item: BucketItem) => void) {
    const tx = this.db.transaction(BUCKET_ITEMS);
    for await (const cursor of tx.store) {
      const doc = cursor.value;
      if (bucketNames.includes(doc.bucket)) {
        callback(cursor.value);
      }
    }
  }
}

export const dbWrapper = new DBWrapper();

export const bucketItemStore = new BucketItemsStore(dbWrapper);
