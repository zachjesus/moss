/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Book} from './asset';

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

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const now = this.getLedgerTimestampISO(ctx);
        const assets: Book[] = [
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
            },
        ];

        for (const asset of assets) {
            await ctx.stub.putState(asset.identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.info(`Asset ${asset.identifier} initialized`);
        }
    }

    @Transaction()
    public async CreateAsset(ctx: Context, identifier: string, title: string, creator: string, subject: string, description: string, publisher: string, date: string, owner: string): Promise<void> {
        const exists = await this.AssetExists(ctx, identifier);
        if (exists) {
            throw new Error(`The asset ${identifier} already exists`);
        }

        const now = this.getLedgerTimestampISO(ctx);
        const asset: Book = {
            docType: 'Book',
            identifier,
            title,
            creator,
            contributor: '',
            publisher,
            subject,
            description,
            type: 'Text',
            date,
            coverage: '',
            format: 'Print',
            source: '',
            language: 'en',
            relation: '',
            rights: '',
            owner,
            lendee: 'none',
            createdAt: now,
            updatedAt: now,
            status: 'open',
        };
        
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction(false)
    public async ReadAsset(ctx: Context, identifier: string): Promise<string> {
        const assetJSON = await ctx.stub.getState(identifier);
        if (assetJSON.length === 0) {
            throw new Error(`The asset ${identifier} does not exist`);
        }
        return assetJSON.toString();
    }

    @Transaction()
    public async UpdateAsset(ctx: Context, identifier: string, title: string, creator: string, subject: string, description: string, publisher: string, date: string, owner: string): Promise<void> {
        const exists = await this.AssetExists(ctx, identifier);
        if (!exists) {
            throw new Error(`The asset ${identifier} does not exist`);
        }

        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Book;
        
        asset.title = title;
        asset.creator = creator;
        asset.subject = subject;
        asset.description = description;
        asset.publisher = publisher;
        asset.date = date;
        asset.owner = owner;
        asset.updatedAt = this.getLedgerTimestampISO(ctx);
        
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async LendAsset(ctx: Context, identifier: string, lendee: string): Promise<void> {
        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Book;
        
        if (asset.status !== 'open') {
            throw new Error(`Asset ${identifier} is not available for lending`);
        }
        
        asset.lendee = lendee;
        asset.status = 'loaned';
        asset.updatedAt = this.getLedgerTimestampISO(ctx);
        
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async ReturnAsset(ctx: Context, identifier: string): Promise<void> {
        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Book;
        
        asset.lendee = 'none';
        asset.status = 'open';
        asset.updatedAt = this.getLedgerTimestampISO(ctx);
        
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async DeleteAsset(ctx: Context, identifier: string): Promise<void> {
        const exists = await this.AssetExists(ctx, identifier);
        if (!exists) {
            throw new Error(`The asset ${identifier} does not exist`);
        }
        return ctx.stub.deleteState(identifier);
    }

    @Transaction(false)
    @Returns('boolean')
    public async AssetExists(ctx: Context, identifier: string): Promise<boolean> {
        const assetJSON = await ctx.stub.getState(identifier);
        return assetJSON.length > 0;
    }

    @Transaction()
    public async TransferAsset(ctx: Context, identifier: string, newOwner: string): Promise<string> {
        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Book;
        const oldOwner = asset.owner;
        asset.owner = newOwner;
        asset.updatedAt = this.getLedgerTimestampISO(ctx);
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    @Transaction(false)
    @Returns('string')
    public async GetAllAssets(ctx: Context): Promise<string> {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue) as Book;
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}