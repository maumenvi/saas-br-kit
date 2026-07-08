export type MetadataPrimitive = string | number | boolean | null;

export type MetadataValue = MetadataPrimitive | SafeMetadata | readonly MetadataValue[];

export interface SafeMetadata {
  readonly [key: string]: MetadataValue;
}
