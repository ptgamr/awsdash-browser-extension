import { IndexOptionsForDocumentSearch } from "flexsearch";
import { BucketItem } from "../../src/types";

export const IN_MESSAGE_TYPES = {
  PING: "PING",
  LIST_BUCKETS: "LIST_BUCKETS",
  LIST_EC2_INSTANCES: "LIST_EC2_INSTANCES",
  SET_CREDENTIALS: "SET_CREDENTIALS",
  LIST_BUCKET_CONTENTS: "LIST_BUCKET_CONTENTS",
  LIST_ALL_BUCKET_CONTENTS: "LIST_ALL_BUCKET_CONTENTS",
  START_INDEX_BUCKET: "START_INDEX_BUCKET",
  STOP_INDEX_BUCKET: "STOP_INDEX_BUCKET",
  LOAD_INDEX: "LOAD_INDEX",
  GET_BUCKET_SEARCH_RESULT: "GET_BUCKET_SEARCH_RESULT",
} as const;

export const OUT_MESSAGE_TYPES = {
  PONG: "PONG",
  LIST_BUCKETS_RESPONSE: "LIST_BUCKETS_RESPONSE",
  LIST_BUCKETS_ERROR: "LIST_BUCKETS_ERROR",
  SET_CREDENTIALS_OK: "SET_CREDENTIALS_OK",
  SET_CREDENTIALS_ERROR: "SET_CREDENTIALS_ERROR",
  LIST_BUCKET_CONTENTS_RESPONSE: "LIST_BUCKET_CONTENTS_RESPONSE",
  LIST_BUCKET_CONTENTS_ERROR: "LIST_BUCKET_CONTENTS_ERROR",
} as const;

export const NOTIFY_MESSAGE_TYPES = {
  EXTENSION_READY: "EXTENSION_READY",
  INDEXING_START: "INDEXING_START",
  INDEXING_PROGRESS: "INDEXING_PROGRESS",
  INDEXING_DONE: "INDEXING_DONE",
  INDEXING_STOPPED: "INDEXING_STOPPED",
  INDEXING_ERROR: "INDEXING_ERROR",
  INDEX_AVAILABLE: "INDEX_AVAILABLE",
  DOCUMENT_FOR_INDEXING: "DOCUMENT_FOR_INDEXING",
  INITIAL_INDEX_LOADING: "INITIAL_INDEX_LOADING",
  INITIAL_INDEX_DONE: "INITIAL_INDEX_DONE",
} as const;

export const INDEX_OPTIONS: IndexOptionsForDocumentSearch<BucketItem> = {
  document: {
    id: "id",
    index: ["key"],
  },
  tokenize: "full", // Tokenize the data for partial matches
  cache: true,
};