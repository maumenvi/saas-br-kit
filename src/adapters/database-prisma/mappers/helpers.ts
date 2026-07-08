import { safeMetadataSchema } from "#contracts";
import type { SafeMetadata } from "#core";
import type { PrismaJson } from "../prisma-types.ts";

export type PrismaRow = Readonly<Record<string, unknown>>;

export function asRow(value: unknown): PrismaRow {
  if (typeof value !== "object" || value === null) {
    throw new Error("Prisma adapter expected an object row.");
  }
  return value as PrismaRow;
}

export function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return new Date(value).toISOString();
  }
  throw new Error("Prisma adapter expected a date-compatible value.");
}

export function toDate(value: string | undefined): Date | undefined {
  return value === undefined ? undefined : new Date(value);
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function safeMetadata(value: unknown): SafeMetadata | undefined {
  const result = safeMetadataSchema.validate(value);
  return result.ok ? (result.value as SafeMetadata) : undefined;
}

export function jsonArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function jsonValue(value: unknown): PrismaJson {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(jsonValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, jsonValue(entry)]));
  }
  return null;
}
