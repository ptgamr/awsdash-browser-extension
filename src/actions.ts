import { BucketItem } from "./types";
import { IN_MESSAGE_TYPES, NOTIFY_MESSAGE_TYPES } from "./constants";

export type ExtIncomingActions =
  | {
      type: typeof IN_MESSAGE_TYPES.PING;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.GET_AWS_PROFILES;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.LIST_BUCKETS;
      profiles: string[];
    }
  | {
      type: typeof IN_MESSAGE_TYPES.GET_S3_OBJECT_URL;
      profileName: string;
      bucketName: string;
      bucketRegion: string;
      key: string;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.LIST_EC2_INSTANCES;
      profiles: string[];
      region: string;
      instanceStateFilter: string[];
    }
  | {
      type: typeof IN_MESSAGE_TYPES.SET_CREDENTIALS;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
        region?: string;
      };
    }
  | {
      type: typeof IN_MESSAGE_TYPES.LIST_BUCKET_CONTENTS;
      awsProfile: string;
      bucketName: string;
      bucketRegion: string;
      prefix?: string;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.LIST_ALL_BUCKET_CONTENTS;
      awsProfile: string;
      bucketName: string;
      bucketRegion: string;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.LOAD_INDEX;
      bucketNames: string[];
    }
  | {
      type: typeof IN_MESSAGE_TYPES.START_INDEX_BUCKET;
      awsProfile: string;
      bucketName: string;
      bucketRegion: string;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.STOP_INDEX_BUCKET;
      indexingProcess: IndexingProcess;
    }
  | {
      type: typeof IN_MESSAGE_TYPES.GET_BUCKET_SEARCH_RESULT;
      bucketName: string;
      id: number;
    };

export interface IndexingProcess {
  pid: string;
  documentCount: number;
  status: "indexing" | "stopping" | "done";
  bucketName: string;
}

export type ExtNotificationActions =
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.EXTENSION_READY;
      profiles: string[];
      version: string;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INDEXING_START;
      indexingProcess: IndexingProcess;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INDEXING_PROGRESS;
      indexingProcess: IndexingProcess;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INDEXING_STOPPED;
      indexingProcess: IndexingProcess;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INDEXING_DONE;
      indexingProcess: IndexingProcess;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INITIAL_INDEX_LOADING;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INITIAL_INDEX_DONE;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.DOCUMENT_FOR_INDEXING;
      item: BucketItem;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.INDEX_AVAILABLE;
      bucketName: string;
      documentCount: number;
      lastIndexed: number;
    }
  | {
      type: typeof NOTIFY_MESSAGE_TYPES.AWS_FETCH_ERROR;
      profileName: string;
      errorMessage: string;
      errorDetail: Error;
    };
