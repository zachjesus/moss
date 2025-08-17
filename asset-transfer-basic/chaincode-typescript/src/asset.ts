import { Object, Property } from "fabric-contract-api";
import {
  metadataHandler,
  isAcceptedFileExtension,
  ACCEPTED_FILE_EXTENSIONS,
  DEFAULT_OWNER,
  validateISO,
  isAcceptedStatus,
  getAcceptedStatuses,
  AssetStatus,
} from "./utils";

@Object()
export class Asset {
  @Property()
  public identifier: string = "";

  @Property()
  public metadata: string

  @Property()
  public owner: string = DEFAULT_OWNER;

  @Property()
  public lendee: string = "none";

  @Property()
  public createdAt: string = "";

  @Property()
  public updatedAt: string = "";

  @Property()
  public status: AssetStatus = "open";

  @Property()
  public licenseEndsAt: string = "";

  @Property()
  public fileLocation: string = "";

  constructor(identifier: string) {
    this.identifier = identifier;
    try {
      this.metadata = metadataHandler(identifier);
    } catch {
      this.metadata = identifier;
    }
  }

  public setMetadata(metadata: string): void {
    if (typeof metadata === "string") {
      if (metadata.trim() === "") {
        throw new Error("metadata must be a non-empty string or object");
      }
      this.metadata = metadata.trim();
      return;
    } 
    throw new Error("metadata must be a non-empty string");
  }

  public setOwner(owner: string): void {
    if (typeof owner !== "string" || owner.trim() === "") {
      throw new Error("owner must be a non-empty string");
    }
    this.owner = owner.trim();
  }

  public setLendee(lendee: string): void {
    if (typeof lendee !== "string" || lendee.trim() === "") {
      throw new Error("lendee must be a non-empty string");
    }
    this.lendee = lendee.trim();
  }

  public setCreatedAt(isoDate: string): void {
    if (typeof isoDate !== "string" || !validateISO(isoDate)) {
      throw new Error("createdAt must be a valid ISO 8601 date string");
    }
    this.createdAt = isoDate;
  }

  public setUpdatedAt(isoDate: string): void {
    if (typeof isoDate !== "string" || !validateISO(isoDate)) {
      throw new Error("updatedAt must be a valid ISO 8601 date string");
    }
    this.updatedAt = isoDate;
  }

  public setStatus(status: AssetStatus): void {
    if (!isAcceptedStatus(status)) {
      throw new Error(
        `status must be one of: ${getAcceptedStatuses().join(", ")}`,
      );
    }
    this.status = status;
  }

  public setLicenseEndsAt(isoDate: string): void {
    if (typeof isoDate !== "string" || !validateISO(isoDate)) {
      throw new Error("licenseEndsAt must be a valid ISO 8601 date string");
    }
    this.licenseEndsAt = isoDate;
  }

  public setFile(location: string, fileNameOrMime: string): void {
    if (typeof location !== "string" || location.trim() === "") {
      throw new Error("file location must be a non-empty string");
    }
    if (typeof fileNameOrMime !== "string" || fileNameOrMime.trim() === "") {
      throw new Error("file mime/name must be a non-empty string");
    }
    if (!isAcceptedFileExtension(fileNameOrMime)) {
      throw new Error(
        `Unsupported file type: ${fileNameOrMime}. Accepted: ${(ACCEPTED_FILE_EXTENSIONS as readonly string[]).join(", ")}`,
      );
    }
    this.fileLocation = location;
  }
}
