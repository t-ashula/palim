import mappingTable from "./idna-mapping.json" with { type: "json" };

export type IDNAMappingStatus =
  "valid" | "mapped" | "ignored" | "deviation" | "disallowed";

export interface IDNAMappingRange {
  readonly start: number;
  readonly end: number;
  readonly status: IDNAMappingStatus;
  readonly mapping: readonly number[];
}

export const IDNA_MAPPING_TABLE = mappingTable as readonly IDNAMappingRange[];
