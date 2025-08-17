/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Asset } from "./asset";
import {
  parseIdentifier,
  DEFAULT_OWNER,
  isAcceptedStatus,
  getAcceptedStatuses,
  IDENTIFIER_TYPES,
} from "./utils";

@Info({
  title: "AssetTransfer",
  description: "Smart contract for trading Dublin Core assets",
})
export class AssetTransferContract extends Contract {
  private getLedgerTimestampISO(ctx: Context): string {
    return ctx.stub.getDateTimestamp().toISOString();
  }

  private async putAsset(ctx: Context, asset: Asset): Promise<void> {
    const serialized: unknown = JSON.parse(JSON.stringify(asset));
    if (typeof serialized !== "object" || serialized === null) {
      throw new Error("failed to serialize asset");
    }
    const plain = serialized as Record<string, unknown>;
    await ctx.stub.putState(
      asset.identifier,
      Buffer.from(stringify(sortKeysRecursive(plain))),
    );
  }

  private requireNonEmpty(value: unknown, name: string) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`${name} is required and must be a non-empty string`);
    }
  }

  private isSupportedIdentifier(identifier: string): boolean {
    try {
      parseIdentifier(identifier);
      return true;
    } catch {
      return false;
    }
  }

  @Transaction()
  public async CreateAsset(
    ctx: Context,
    identifier: string,
    owner: string = DEFAULT_OWNER,
    status: string = "open",
    fileLocation: string = "",
    fileMimeOrName: string = "",
  ): Promise<void> {
    if (!this.isSupportedIdentifier(identifier)) {
      const allowed = Array.from(IDENTIFIER_TYPES)
        .map((t) => `${t}_<value>`)
        .join(", ");
      throw new Error(`Identifier must be a supported type (e.g. ${allowed})`);
    }

    const exists = await this.AssetExists(ctx, identifier);
    if (exists) {
      throw new Error(`The asset ${identifier} already exists`);
    }

    if (fileLocation && !fileMimeOrName) {
      throw new Error(
        "fileMimeOrName is required when fileLocation is provided",
      );
    }

    if (typeof status !== "string" || !isAcceptedStatus(status)) {
      throw new Error(
        `Invalid status value: ${String(status)}. Accepted: ${getAcceptedStatuses().join(", ")}`,
      );
    }

    const now = this.getLedgerTimestampISO(ctx);
    const asset = new Asset(identifier);

    if (typeof owner === "string" && owner.trim() !== "") {
      asset.setOwner(owner);
    }

    asset.setLendee("none");
    asset.setCreatedAt(now);
    asset.setUpdatedAt(now);
    asset.setStatus(status);

    if (fileLocation) {
      asset.setFile(fileLocation, fileMimeOrName);
    }

    await this.putAsset(ctx, asset);
  }

  @Transaction(false)
  public async ReadAsset(ctx: Context, identifier: string): Promise<string> {
    this.requireNonEmpty(identifier, "identifier");
    const assetJSON = await ctx.stub.getState(identifier);
    if (assetJSON.length === 0) {
      throw new Error(`The asset ${identifier} does not exist`);
    }
    return assetJSON.toString();
  }

  @Transaction()
  public async UpdateAsset(
    ctx: Context,
    identifier: string,
    updates: string,
  ): Promise<void> {
    this.requireNonEmpty(identifier, "identifier");
    this.requireNonEmpty(updates, "updates");

    const exists = await this.AssetExists(ctx, identifier);
    if (!exists) {
      throw new Error(`The asset ${identifier} does not exist`);
    }

    let updateData: Record<string, unknown>;
    try {
      updateData = JSON.parse(updates) as Record<string, unknown>;
    } catch {
      throw new Error("updates must be a valid JSON string");
    }

    const assetJSON = await ctx.stub.getState(identifier);
    const stored = JSON.parse(assetJSON.toString()) as Record<string, unknown>;
    const asset = Object.assign(
      new Asset(identifier),
      stored as Partial<Asset>,
    );

    if ("owner" in updateData) {
      this.requireNonEmpty(updateData.owner, "owner");
      asset.setOwner(String(updateData.owner));
    }

    if ("status" in updateData) {
      this.requireNonEmpty(updateData.status, "status");
      const s = String(updateData.status);
      if (!isAcceptedStatus(s)) {
        throw new Error(
          `Invalid status value: ${String(updateData.status)}. Accepted: ${getAcceptedStatuses().join(", ")}`,
        );
      }
      asset.setStatus(s);
    }

    if ("lendee" in updateData) {
      this.requireNonEmpty(updateData.lendee, "lendee");
      asset.setLendee(String(updateData.lendee));
    }

    if ("licenseEndsAt" in updateData) {
      this.requireNonEmpty(updateData.licenseEndsAt, "licenseEndsAt");
      asset.setLicenseEndsAt(String(updateData.licenseEndsAt));
    }

    if ("fileLocation" in updateData) {
      this.requireNonEmpty(updateData.fileLocation, "fileLocation");
      this.requireNonEmpty(updateData["fileMimeOrName"], "fileMimeOrName");
      asset.setFile(
        String(updateData.fileLocation),
        String(updateData["fileMimeOrName"]),
      );
    }

    if ("metadata" in updateData) {
      const md = updateData.metadata;
      if (typeof md === "string") {
        asset.setMetadata(md);
      } else if (typeof md === "object" && md !== null) {
        asset.setMetadata(stringify(md as Record<string, unknown>));
    } else {
        throw new Error("metadata must be a non-empty string or object");
      }
    }

    asset.setUpdatedAt(this.getLedgerTimestampISO(ctx));

    await this.putAsset(ctx, asset);
  }

  @Transaction()
  public async LendAsset(
    ctx: Context,
    identifier: string,
    lendee: string,
  ): Promise<void> {
    this.requireNonEmpty(identifier, "identifier");
    this.requireNonEmpty(lendee, "lendee");

    const assetJSON = await ctx.stub.getState(identifier);
    if (assetJSON.length === 0) {
      throw new Error(`The asset ${identifier} does not exist`);
    }

    const stored = JSON.parse(assetJSON.toString()) as Record<string, unknown>;
    const asset = Object.assign(
      new Asset(identifier),
      stored as Partial<Asset>,
    );

    if (asset.status !== "open") {
      throw new Error(
        `Asset ${identifier} is not available for lending (current status: ${asset.status})`,
      );
    }

    asset.setStatus("loaned");
    asset.setLendee(lendee);
    asset.setUpdatedAt(this.getLedgerTimestampISO(ctx));

    await this.putAsset(ctx, asset);
  }

  @Transaction()
  public async ReturnAsset(ctx: Context, identifier: string): Promise<void> {
    this.requireNonEmpty(identifier, "identifier");

    const assetJSON = await ctx.stub.getState(identifier);
    if (assetJSON.length === 0) {
      throw new Error(`The asset ${identifier} does not exist`);
    }

    const stored = JSON.parse(assetJSON.toString()) as Record<string, unknown>;
    const asset = Object.assign(
      new Asset(identifier),
      stored as Partial<Asset>,
    );

    if (asset.status !== "loaned") {
      throw new Error(
        `Asset ${identifier} is not currently loaned (current status: ${asset.status})`,
      );
    }

    asset.setStatus("open");
    asset.setLendee("none");
    asset.setUpdatedAt(this.getLedgerTimestampISO(ctx));

    await this.putAsset(ctx, asset);
  }

  @Transaction()
  public async DeleteAsset(ctx: Context, identifier: string): Promise<void> {
    this.requireNonEmpty(identifier, "identifier");
    const exists = await this.AssetExists(ctx, identifier);
    if (!exists) {
      throw new Error(`The asset ${identifier} does not exist`);
    }
    return ctx.stub.deleteState(identifier);
  }

  @Transaction(false)
  @Returns("boolean")
  public async AssetExists(ctx: Context, identifier: string): Promise<boolean> {
    if (!identifier) return false;
    const assetJSON = await ctx.stub.getState(identifier);
    return assetJSON.length > 0;
  }

  @Transaction(false)
  @Returns("string")
  public async GetAllAssets(ctx: Context): Promise<string> {
    const allResults: Asset[] = [];
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8",
      );
      try {
        const record = JSON.parse(strValue) as Asset;
        allResults.push(record);
      } catch (err) {
        console.log(err);
      }
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}
