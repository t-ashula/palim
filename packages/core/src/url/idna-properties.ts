import propertyData from "./idna-properties.json" with { type: "json" };

export interface IDNACodePointRange {
  readonly start: number;
  readonly end: number;
}

export interface IDNAPropertyRange extends IDNACodePointRange {
  readonly value: string;
}

export const IDNA_VIRAMA_RANGES =
  propertyData.viramaRanges as readonly IDNACodePointRange[];
export const IDNA_JOINING_TYPE_RANGES =
  propertyData.joiningTypeRanges as readonly IDNAPropertyRange[];
export const IDNA_BIDI_CLASS_RANGES =
  propertyData.bidiClassRanges as readonly IDNAPropertyRange[];
