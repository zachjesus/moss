/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Asset} from './asset';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading Dublin Core assets'})
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

    // Basic validation helpers
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

    private validateAssetShape(a: Partial<Asset>) {
        // Required always
        this.requireNonEmpty(a.docType, 'docType');
        this.requireNonEmpty(a.identifier, 'identifier');

        // Common Dublin Core fields that should not be empty for library items
        this.requireNonEmpty(a.title, 'title');
        this.requireNonEmpty(a.creator, 'creator');
        this.requireNonEmpty(a.publisher, 'publisher');
        this.requireNonEmpty(a.type, 'type');

        if (a.language && typeof a.language !== 'string') {
            throw new Error('language must be a string');
        }

        if (a.status) {
            this.validateStatus(a.status);
        }

        if (a.status === 'loaned' && (!a.lendee || a.lendee === 'none')) {
            throw new Error('lendee is required when status is loaned');
        }
    }

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const now = this.getLedgerTimestampISO(ctx);
        const assets: Asset[] = [
            {
                docType: 'Book', 
                identifier: 'book001',
                title: 'Dune',
                creator: 'Frank Herbert',
                subject: 'Science Fiction; Politics; Ecology; Religion',
                description: 'A science fiction epic set on the desert planet Arrakis.',
                publisher: 'Chilton Books',
                contributor: 'John Schoenherr (cover art)',
                date: '1965-08-01',
                type: 'Text; Novel',
                format: 'Print; Hardcover',
                source: 'Analog Science Fiction magazine (serialized)',
                language: 'en',
                relation: 'Original Dune',
                coverage: 'Far future; Desert planet',
                rights: 'Copyright Frank Herbert Estate',
                owner: 'Zachary Rosario',
                lendee: 'none',
                createdAt: now,
                updatedAt: now,
                status: 'open',
                // file omitted
            },
        ];

        for (const asset of assets) {
            this.validateAssetShape(asset);
            await ctx.stub.putState(asset.identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.info(`Asset ${asset.identifier} initialized`);
        }
    }

    @Transaction()
    public async CreateAsset(
        ctx: Context,
        docType: string,
        identifier: string,
        title: string,
        creator: string,
        contributor: string,
        publisher: string,
        subject: string,
        description: string,
        type: string,
        date: string,
        coverage: string,
        format: string,
        source: string,
        language: string,
        relation: string,
        rights: string,
        owner: string = 'Zachary Rosario',
        status: string = 'open',
    ): Promise<void> {
        const exists = await this.AssetExists(ctx, identifier);
        if (exists) {
            throw new Error(`The asset ${identifier} already exists`);
        }

        // Basic param checks
        this.requireNonEmpty(docType, 'docType');
        this.requireNonEmpty(identifier, 'identifier');
        this.requireNonEmpty(title, 'title');
        this.requireNonEmpty(creator, 'creator');
        this.requireNonEmpty(publisher, 'publisher');
        this.requireNonEmpty(type, 'type');
        this.validateStatus(status);

        const now = this.getLedgerTimestampISO(ctx);
        const asset: Asset = {
            docType,
            identifier,
            title,
            creator,
            contributor,
            publisher,
            subject,
            description,
            type,
            date,
            coverage,
            format,
            source,
            language,
            relation,
            rights,
            owner,
            lendee: 'none',
            createdAt: now,
            updatedAt: now,
            status: status as Asset['status'],
        };

        this.validateAssetShape(asset);
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
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

        // Apply updates (only known fields)
        if (updateData.docType !== undefined) this.requireNonEmpty(updateData.docType, 'docType'), asset.docType = updateData.docType;
        if (updateData.title !== undefined) asset.title = updateData.title;
        if (updateData.creator !== undefined) asset.creator = updateData.creator;
        if (updateData.contributor !== undefined) asset.contributor = updateData.contributor;
        if (updateData.publisher !== undefined) asset.publisher = updateData.publisher;
        if (updateData.subject !== undefined) asset.subject = updateData.subject;
        if (updateData.description !== undefined) asset.description = updateData.description;
        if (updateData.type !== undefined) asset.type = updateData.type;
        if (updateData.date !== undefined) asset.date = updateData.date;
        if (updateData.coverage !== undefined) asset.coverage = updateData.coverage;
        if (updateData.format !== undefined) asset.format = updateData.format;
        if (updateData.source !== undefined) asset.source = updateData.source;
        if (updateData.language !== undefined) asset.language = updateData.language;
        if (updateData.relation !== undefined) asset.relation = updateData.relation;
        if (updateData.rights !== undefined) asset.rights = updateData.rights;
        if (updateData.owner !== undefined) asset.owner = updateData.owner;

        if (updateData.status !== undefined) {
            this.validateStatus(updateData.status);
            asset.status = updateData.status;
        }

        if (updateData.lendee !== undefined) {
            asset.lendee = updateData.lendee;
        }

        // Additional consistency checks
        if (asset.status === 'loaned' && (!asset.lendee || asset.lendee === 'none')) {
            throw new Error('lendee is required when status is loaned');
        }

        asset.updatedAt = this.getLedgerTimestampISO(ctx);

        this.validateAssetShape(asset);
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async LendAsset(ctx: Context, identifier: string, lendee: string): Promise<void> {
        this.requireNonEmpty(identifier, 'identifier');
        this.requireNonEmpty(lendee, 'lendee');

        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Asset;

        if (asset.status !== 'open') {
            throw new Error(`Asset ${identifier} is not available for lending`);
        }
        if (lendee === 'none') {
            throw new Error('lendee must not be "none" when lending');
        }
        if (asset.owner && asset.owner === lendee) {
            throw new Error('lendee cannot be the owner');
        }

        asset.lendee = lendee;
        asset.status = 'loaned';
        asset.updatedAt = this.getLedgerTimestampISO(ctx);

        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async ReturnAsset(ctx: Context, identifier: string): Promise<void> {
        this.requireNonEmpty(identifier, 'identifier');

        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Asset;

        if (asset.status !== 'loaned') {
            throw new Error(`Asset ${identifier} is not currently loaned`);
        }

        asset.lendee = 'none';
        asset.status = 'open';
        asset.updatedAt = this.getLedgerTimestampISO(ctx);

        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
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