import browser from "webextension-polyfill";
import {
  S3Client,
  ListBucketsCommand,
  GetBucketLocationCommand,
  ListObjectsV2Command,
  ListObjectsV2Output,
} from "@aws-sdk/client-s3";
import { DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  IN_MESSAGE_TYPES,
  OUT_MESSAGE_TYPES,
  NOTIFY_MESSAGE_TYPES,
} from "./constants";
import { BucketInfo, BucketItem, Ec2Instance } from "../../src/types";
import localForage from "localforage";
import { nanoid } from "nanoid";
import {
  ExtIncomingActions,
  ExtNotificationActions,
  IndexingProcess,
} from "./actions";
import { bucketItemStore, dbWrapper } from "./indexdb";
import { parseReservationResponse } from "./ec2-transforms";

localForage.setDriver(localForage.INDEXEDDB);

console.log("Background script loaded");

browser.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
  console.log("Background script received message:", rawMessage);

  const message = rawMessage as ExtIncomingActions;

  switch (message.type) {
    case IN_MESSAGE_TYPES.PING:
      sendResponse({ type: OUT_MESSAGE_TYPES.PONG });
      return true;

    case IN_MESSAGE_TYPES.LIST_EC2_INSTANCES:
      listEc2Instances(message.region, message.instanceStateFilter)
        .then((instances) => {
          sendResponse({ instances });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true;
    case IN_MESSAGE_TYPES.LIST_BUCKETS:
      listBuckets()
        .then((buckets) => {
          console.log("Buckets listed:", buckets);
          sendResponse({
            type: OUT_MESSAGE_TYPES.LIST_BUCKETS_RESPONSE,
            buckets: buckets,
          });
        })
        .catch((error) => {
          console.error("Error listing buckets:", error);
          sendResponse({
            type: OUT_MESSAGE_TYPES.LIST_BUCKETS_ERROR,
            error: error.message,
          });
        });
      return true;

    case IN_MESSAGE_TYPES.LIST_BUCKET_CONTENTS:
      listBucketContents(
        message.bucketName,
        message.bucketRegion,
        message.prefix,
      )
        .then((contents) => {
          console.log("Bucket contents listed:", contents);
          sendResponse({
            type: OUT_MESSAGE_TYPES.LIST_BUCKET_CONTENTS_RESPONSE,
            contents: contents,
          });
        })
        .catch((error) => {
          console.error("Error listing bucket contents:", error);
          sendResponse({
            type: OUT_MESSAGE_TYPES.LIST_BUCKET_CONTENTS_ERROR,
            error: error.message,
          });
        });
      return true;

    case IN_MESSAGE_TYPES.LIST_ALL_BUCKET_CONTENTS:
      listAllBucketContents(message.bucketName, message.bucketRegion)
        .then((contents) => {
          sendResponse({ contents });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });
      return true;

    case IN_MESSAGE_TYPES.LOAD_INDEX:
      void requestBucketIndices(message.bucketNames);
      sendResponse({ ok: true });
      return true;

    case IN_MESSAGE_TYPES.GET_BUCKET_SEARCH_RESULT:
      getBucketSearchResult(message.bucketName, message.id).then((item) => {
        sendResponse({ item: item || null });
      });
      return true;

    case IN_MESSAGE_TYPES.START_INDEX_BUCKET:
      void startIndexBucket({
        name: message.bucketName,
        location: message.bucketRegion,
      });
      return true;

    case IN_MESSAGE_TYPES.STOP_INDEX_BUCKET:
      stopIndexBucket(message.indexingProcess);
      return true;
  }
});

async function getCredentials(): Promise<null | {
  accessKeyId: string;
  secretAccessKey: string;
}> {
  const result = await browser.storage.local.get("awsCredentials");
  return result.awsCredentials as {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

async function listEc2Instances(
  region: string,
  instanceStateFilter: string[],
): Promise<Ec2Instance[]> {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error("AWS credentials not set");
  }

  const ec2Client = new EC2Client({
    credentials,
    region,
  });

  const command = new DescribeInstancesCommand({
    Filters: [
      {
        Name: "instance-state-name",
        Values: instanceStateFilter,
      },
    ],
  });

  const { Reservations } = await ec2Client.send(command);

  return parseReservationResponse(Reservations);
}

async function listBuckets(): Promise<BucketInfo[]> {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error("AWS credentials not set");
  }

  const s3Client = new S3Client({
    credentials,
    region: "us-east-1",
  });

  const command = new ListBucketsCommand({});
  const { Buckets } = await s3Client!.send(command);

  if (!Buckets) {
    return [];
  }

  const buckets: BucketInfo[] = await Promise.all(
    Buckets.map(async (bucket) => {
      const locationCommand = new GetBucketLocationCommand({
        Bucket: bucket.Name,
      });
      try {
        const { LocationConstraint } = await s3Client!.send(locationCommand);
        return {
          name: bucket.Name!,
          location: LocationConstraint || "us-east-1",
        };
      } catch (error) {
        console.error(
          `Error getting location for bucket ${bucket.Name}:`,
          error,
        );
        return {
          name: bucket.Name!,
          location: "Unknown",
        };
      }
    }),
  );

  const store = await getBucketsIndexStore();
  for (const bucket of buckets) {
    const documentCount = await store.getItem(`index_count_${bucket.name}`);
    const lastIndexed = await store.getItem(`index_time_${bucket.name}`);

    if (lastIndexed) {
      bucket.documentCount = documentCount as number;
      bucket.lastIndexed = lastIndexed as number;
    }
  }

  return buckets;
}

async function listBucketContents(
  bucketName: string,
  bucketRegion: string,
  prefix: string = "",
): Promise<BucketItem[]> {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error("AWS credentials not set");
  }

  // Create a new S3 client with the correct region
  const regionSpecificS3Client = new S3Client({
    credentials,
    region: bucketRegion,
  });

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Delimiter: "/",
    Prefix: prefix,
  });

  const response = await regionSpecificS3Client.send(command);

  const contents = [
    ...(response.CommonPrefixes || []).map((commonPrefix) => ({
      bucket: bucketName,
      name: commonPrefix.Prefix!.slice(prefix.length, -1), // Remove prefix and trailing slash
      type: "folder" as const,
      key: commonPrefix.Prefix!,
      syncTimestamp: Date.now(),
    })),
    ...(response.Contents || [])
      .filter((item) => item.Key !== prefix) // Exclude the current prefix itself
      .map((item) => toBucketItem(bucketName, item)),
  ];

  return contents;
}

async function listAllBucketContents(
  bucketName: string,
  bucketRegion: string,
): Promise<BucketItem[]> {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error("AWS credentials not set");
  }

  // Create a new S3 client with the correct region
  const regionSpecificS3Client = new S3Client({
    credentials,
    region: bucketRegion,
  });
  let contents: BucketItem[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });

    try {
      const response = await regionSpecificS3Client.send(command);
      if (response.Contents) {
        contents = contents.concat(
          response.Contents.map((item) => toBucketItem(bucketName, item)),
        );
      }
      console.log("listAllBucketContents: ", contents);
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error("Error listing bucket contents:", error);
      throw error;
    }
  } while (continuationToken);

  return contents;
}

// Create a single store for all bucket indexes
const getBucketsIndexStore = () => {
  return localForage.createInstance({
    name: "AwsDashComFlex",
    storeName: "buckets_index",
  });
};

async function idbPromise() {
  await dbWrapper.connect();
}

idbPromise().then(() => {
  console.log("IDB READY!");
});

let contentScriptPorts: browser.Runtime.Port[] = [];

// Listen for connection attempts from content scripts
browser.runtime.onConnect.addListener((port) => {
  if (port.name === "awsdashcom-background-to-content") {
    console.log("Content script connected");
    contentScriptPorts.push(port);

    port.onDisconnect.addListener(() => {
      contentScriptPorts = contentScriptPorts.filter((p) => p !== port);
      console.log("Content script disconnected");
    });
  }
});

// Modify the notifyAwsComWeb function to use the established connections
function notifyAwsComWeb(notif: ExtNotificationActions) {
  contentScriptPorts.forEach((port) => {
    port.postMessage({ type: "NOTIFICATION", payload: notif });
  });
}

async function requestBucketIndices(bucketNames: string[]) {
  notifyAwsComWeb({
    type: NOTIFY_MESSAGE_TYPES.INITIAL_INDEX_LOADING,
  });

  await bucketItemStore.iterate(bucketNames, (item: BucketItem) => {
    notifyAwsComWeb({
      type: NOTIFY_MESSAGE_TYPES.DOCUMENT_FOR_INDEXING,
      item,
    });
  });

  notifyAwsComWeb({
    type: NOTIFY_MESSAGE_TYPES.INITIAL_INDEX_DONE,
  });
}

const indexingProcesses: Record<string, IndexingProcess> = {};

async function stopIndexBucket(p: IndexingProcess) {
  if (indexingProcesses[p.bucketName]?.pid === p.pid) {
    indexingProcesses[p.bucketName].status = "stopping";
    notifyAwsComWeb({
      type: NOTIFY_MESSAGE_TYPES.INDEXING_PROGRESS,
      indexingProcess: indexingProcesses[p.bucketName],
    });
  }
}
async function startIndexBucket(bucket: BucketInfo) {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error("AWS credentials not set");
  }
  // Create a new S3 client with the correct region
  const regionSpecificS3Client = new S3Client({
    credentials,
    region: bucket.location,
  });

  indexingProcesses[bucket.name] = {
    pid: nanoid(),
    documentCount: 0,
    status: "indexing",
    bucketName: bucket.name,
  };

  notifyAwsComWeb({
    type: NOTIFY_MESSAGE_TYPES.INDEXING_START,
    indexingProcess: indexingProcesses[bucket.name],
  });

  const syncTimestamp = Date.now();

  await idbPromise();

  try {
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket.name,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      try {
        if (
          !indexingProcesses[bucket.name] ||
          indexingProcesses[bucket.name].status === "stopping"
        ) {
          notifyAwsComWeb({
            type: NOTIFY_MESSAGE_TYPES.INDEXING_STOPPED,
            indexingProcess: indexingProcesses[bucket.name],
          });
          throw new Error("Indexing process is interuptted!");
        }

        const response = await regionSpecificS3Client.send(command);
        if (response.Contents) {
          for (const item of response.Contents) {
            indexingProcesses[bucket.name].documentCount++;
            const doc = toBucketItem(bucket.name, item, syncTimestamp);
            notifyAwsComWeb({
              type: NOTIFY_MESSAGE_TYPES.DOCUMENT_FOR_INDEXING,
              item: await bucketItemStore.upsert(doc),
            });
          }
        }
        console.log(
          "Bucket index progress, num docs = ",
          indexingProcesses[bucket.name].documentCount,
        );
        notifyAwsComWeb({
          type: NOTIFY_MESSAGE_TYPES.INDEXING_PROGRESS,
          indexingProcess: indexingProcesses[bucket.name],
        });
        continuationToken = response.NextContinuationToken;
      } catch (error) {
        console.error("Error indexing bucket:", bucket.name, error);
        throw error;
      }
    } while (continuationToken);

    await bucketItemStore.deleteNonCurrentVersion(bucket.name, syncTimestamp);

    const documentCount = indexingProcesses[bucket.name].documentCount;
    const lastIndexedAt = Date.now();

    const store = getBucketsIndexStore();
    await store.setItem(`index_count_${bucket.name}`, documentCount);
    await store.setItem(`index_time_${bucket.name}`, lastIndexedAt);

    console.log(`Index for ${bucket.name} saved successfully`);

    indexingProcesses[bucket.name].status = "done";

    notifyAwsComWeb({
      type: NOTIFY_MESSAGE_TYPES.INDEXING_DONE,
      indexingProcess: indexingProcesses[bucket.name],
    });

    notifyAwsComWeb({
      type: NOTIFY_MESSAGE_TYPES.INDEX_AVAILABLE,
      bucketName: bucket.name,
      documentCount: documentCount,
      lastIndexed: lastIndexedAt,
    });
  } catch (error) {
    console.error(`Error indexing ${bucket.name}:`, error);
  } finally {
    delete indexingProcesses[bucket.name];
  }
}

async function getBucketSearchResult(bucketName: string, id: number) {
  return bucketItemStore.getByBucketAndId(bucketName, id);
}

function toBucketItem(
  bucket: string,
  item: NonNullable<ListObjectsV2Output["Contents"]>[0],
  syncTimestamp?: number,
): BucketItem {
  return {
    bucket: bucket,
    key: item.Key!,
    type: item.Key!.endsWith("/") ? "folder" : "file",
    size: item.Size,
    lastModified: item.LastModified?.toISOString(),
    storageClass: item.StorageClass,
    etag: item.ETag,
    restoreStatus: item.RestoreStatus
      ? {
          isRestoreInProgress: item.RestoreStatus.IsRestoreInProgress,
          restoreExpiryDate:
            item.RestoreStatus.RestoreExpiryDate?.toISOString(),
        }
      : undefined,
    syncTimestamp: syncTimestamp || Date.now(),
  };
}
