import { InstanceStateName } from "@aws-sdk/client-ec2";

export interface Ec2Instance {
  id: string;
  type: string;
  name: string;
  ipv4: string;
  ipv4private: string;
  launchedAt: string;
  keyName: string;
  numCpu: number;
  numThread: number;
  vpcId: string;
  stateName: InstanceStateName;
  autoscalingGroup: string | null;
}

export interface BucketItem {
  id?: string;
  bucket: string;
  key: string;
  type: "folder" | "file";
  syncTimestamp: number;
  uri?: string;
  size?: number;
  lastModified?: string;
  storageClass?: string;
  etag?: string;
  restoreStatus?: {
    isRestoreInProgress?: boolean;
    restoreExpiryDate?: string;
  };
}

export interface SearchResults {
  totalCount: number;
  results: BucketItem[];
}
export interface BucketInfo {
  name: string;
  location: string;
  documentCount?: number;
  lastIndexed?: number;
}
