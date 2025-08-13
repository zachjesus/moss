/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { Asset } from './asset';

@Info({ title: 'AssetTransfer', description: 'Smart contract for trading Dublin Core assets' })
export class AssetTransferContract extends Contract {

    private getLedgerTimestampISO(ctx: Context): string {
        const ts: any = ctx.stub.getTxTimestamp() as any;
        if (ts instanceof Date) {
            return ts.toISOString();
        }
        const seconds = typeof ts?.seconds === 'number' ? ts.seconds : (ts?.seconds?.low ?? 0);
        const nanos = ts?.nanos ?? 0;
        return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000)).toISOString();
    }

    private requireNonEmpty(value: unknown, name: string) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`${name} is required and must be a non-empty string`);
        }
    }

    private validateStatus(status: unknown) {
        if (status !== 'open' && status !== 'loaned' && status !== 'locked') {
            throw new Error(`Invalid status value: ${status as string}`);
        }
    }

    private isSupportedIdentifier(identifier: string): boolean {
        return /^(ISBN|OCLC|LCCN|OLID|DOI)_/.test(identifier);
    }

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        return;
    }

    @Transaction()
    public async CreateAsset(
        ctx: Context,
        docType: string,
        identifier: string,
        owner: string = 'Zachary Rosario',
        status: string,
        licenseEndsAt: string,
        file: string
    ): Promise<void> {
        if (!this.isSupportedIdentifier(identifier)) {
            throw new Error('Identifier must start with ISBN_, OCLC_, LCCN_, OLID_, or DOI_');
        }

        const exists = await this.AssetExists(ctx, identifier);
        if (exists) {
            throw new Error(`The asset ${identifier} already exists`);
        }

        this.requireNonEmpty(docType, 'docType');
        this.requireNonEmpty(owner, 'owner');
        this.validateStatus(status);

        const now = this.getLedgerTimestampISO(ctx);
        const asset = new Asset(identifier);
        asset.docType = docType;
        asset.owner = owner;
        asset.lendee = 'none';
        asset.createdAt = now;
        asset.updatedAt = now;
        asset.status = status as Asset['status'];
        asset.licenseEndsAt = licenseEndsAt;
        if (file) asset['file'] = file;

        await ctx.stub.putState(asset._identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction(false)
    public async ReadAsset(ctx: Context, identifier: string): Promise<string> {
        this.requireNonEmpty(identifier, 'identifier');
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
        updates: string
    ): Promise<void> {
        this.requireNonEmpty(identifier, 'identifier');
        this.requireNonEmpty(updates, 'updates');

        const exists = await this.AssetExists(ctx, identifier);
        if (!exists) {
            throw new Error(`The asset ${identifier} does not exist`);
        }

        let updateData: Partial<Asset>;
        try {
            updateData = JSON.parse(updates);
        } catch {
            throw new Error('updates must be a valid JSON string');
        }

        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Asset;

        if (updateData.docType !== undefined) this.requireNonEmpty(updateData.docType, 'docType'), asset.docType = updateData.docType;
        if (updateData.owner !== undefined) this.requireNonEmpty(updateData.owner, 'owner'), asset.owner = updateData.owner;
        if (updateData.status !== undefined) this.requireNonEmpty(updateData.status, 'status'), this.validateStatus(updateData.status), asset.status = updateData.status;
        if (updateData.lendee !== undefined) this.requireNonEmpty(updateData.lendee, 'lendee'), asset.lendee = updateData.lendee;
        if (updateData.licenseEndsAt !== undefined) this.requireNonEmpty(updateData.licenseEndsAt, 'licenseEndsAt'), asset.licenseEndsAt = updateData.licenseEndsAt;
        if (updateData.file !== undefined) this.requireNonEmpty(updateData.file, 'file'), asset.file = updateData.file;

        asset.updatedAt = this.getLedgerTimestampISO(ctx);

        await ctx.stub.putState(asset._identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async LendAsset(ctx: Context, identifier: string, lendee: string): Promise<void> {
        return;
    }

    @Transaction()
    public async ReturnAsset(ctx: Context, identifier: string): Promise<void> {
        return;
    }

    @Transaction()
    public async DeleteAsset(ctx: Context, identifier: string): Promise<void> {
        this.requireNonEmpty(identifier, 'identifier');
        const exists = await this.AssetExists(ctx, identifier);
        if (!exists) {
            throw new Error(`The asset ${identifier} does not exist`);
        }
        return ctx.stub.deleteState(identifier);
    }

    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, identifier: string): Promise<boolean> {
        if (!identifier) return false;
        const assetJSON = await ctx.stub.getState(identifier);
        return assetJSON.length > 0;
    }

    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults: Asset[] = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
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