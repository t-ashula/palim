import { createHostServiceKey } from "./index.js";

export interface HostCancellation {
  readonly aborted: boolean;
  onAbort(callback: () => void): () => void;
}

export interface HostNetworkRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: Uint8Array | null;
  readonly cancellation: HostCancellation;
}

export interface HostNetworkResponse {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: Uint8Array;
}

export interface HostNetwork {
  request(request: HostNetworkRequest): Promise<HostNetworkResponse>;
}

export const hostNetworkService = createHostServiceKey<HostNetwork>("network");
