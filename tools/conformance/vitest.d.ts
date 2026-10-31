import "vitest";

import type { ConformanceCaseMetadata } from "./report.js";

declare module "vitest" {
  interface TaskMeta {
    conformance?: ConformanceCaseMetadata;
  }
}
