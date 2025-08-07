/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Book} from './asset';

@Info({title: 'AssetTransfer', description: 'Smart contract for trading Dublin Core assets'})
export class AssetTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
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
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'open',
            },
            {
                docType: 'Book',
                identifier: 'book002',
                title: 'Neuromancer',
                creator: 'William Gibson',
                subject: 'Cyberpunk; Artificial Intelligence; Virtual Reality; Dystopia',
                description: 'A groundbreaking cyberpunk novel about a washed-up computer hacker hired for one last job in cyberspace.',
                publisher: 'Ace Books',
                contributor: 'James Warhola (cover art)',
                date: '1984-07-01',
                type: 'Text; Novel',
                format: 'Print; Paperback',
                source: 'Original work',
                language: 'en',
                relation: 'First novel in Sprawl trilogy',
                coverage: '2030s; Chiba City; Cyberspace',
                rights: 'Copyright William Gibson',
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'open',
            },
            {
                docType: 'Book',
                identifier: 'book003',
                title: 'The Foundation',
                creator: 'Isaac Asimov',
                subject: 'Science Fiction; Psychohistory; Galactic Empire',
                description: 'The first novel in the Foundation series about the fall of a galactic empire and the science of psychohistory.',
                publisher: 'Gnome Press',
                contributor: 'Edd Cartier (illustrations)',
                date: '1951-05-01',
                type: 'Text; Novel',
                format: 'Print; Hardcover',
                source: 'Astounding Science Fiction magazine',
                language: 'en',
                relation: 'First in Foundation series',
                coverage: 'Far future; Galactic Empire',
                rights: 'Copyright Isaac Asimov Estate',
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'open',
            },
            {
                docType: 'Book',
                identifier: 'book004',
                title: 'Hyperion',
                creator: 'Dan Simmons',
                subject: 'Science Fiction; Space Opera; Time Travel; AI',
                description: 'A Canterbury Tales-style narrative about pilgrims journeying to the mysterious world of Hyperion.',
                publisher: 'Doubleday',
                contributor: 'Gary Ruddell (cover art)',
                date: '1989-05-26',
                type: 'Text; Novel',
                format: 'Print; Hardcover',
                source: 'Original work',
                language: 'en',
                relation: 'First in Hyperion Cantos series',
                coverage: '28th century; Planet Hyperion',
                rights: 'Copyright Dan Simmons',
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'open',
            },
            {
                docType: 'Book',
                identifier: 'book005',
                title: 'The Left Hand of Darkness',
                creator: 'Ursula K. Le Guin',
                subject: 'Science Fiction; Gender; Politics; Anthropology',
                description: 'A groundbreaking exploration of gender and society on a planet where inhabitants can change sex.',
                publisher: 'Ace Books',
                contributor: 'Leo and Diane Dillon (cover art)',
                date: '1969-03-01',
                type: 'Text; Novel',
                format: 'Print; Paperback',
                source: 'Original work',
                language: 'en',
                relation: 'Part of Hainish Cycle',
                coverage: 'Planet Gethen (Winter)',
                rights: 'Copyright Ursula K. Le Guin Estate',
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'open',
            },
            {
                docType: 'Book',
                identifier: 'book006',
                title: 'Ender\'s Game',
                creator: 'Orson Scott Card',
                subject: 'Science Fiction; Military; Children; Strategy',
                description: 'A young boy is recruited to attend Battle School and trained to fight against an alien invasion.',
                publisher: 'Tor Books',
                contributor: 'John Harris (cover art)',
                date: '1985-01-15',
                type: 'Text; Novel',
                format: 'Print; Hardcover',
                source: 'Analog Science Fiction magazine (short story)',
                language: 'en',
                relation: 'First in Ender Quintet series',
                coverage: 'Near future; Space; Battle School',
                rights: 'Copyright Orson Scott Card',
                owner: 'University Library 1',
                lendee: 'none',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
        asset.updatedAt = new Date().toISOString();
        
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
        asset.updatedAt = new Date().toISOString();
        
        await ctx.stub.putState(identifier, Buffer.from(stringify(sortKeysRecursive(asset))));
    }

    @Transaction()
    public async ReturnAsset(ctx: Context, identifier: string): Promise<void> {
        const assetString = await this.ReadAsset(ctx, identifier);
        const asset = JSON.parse(assetString) as Book;
        
        asset.lendee = 'none';
        asset.status = 'open';
        asset.updatedAt = new Date().toISOString();
        
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