/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

/**
 * Asset class representing a digital asset with Dublin Core metadata
 * following archival best practices for digital preservation
 */
@Object()
export class Book {
    @Property()
    public readonly docType: string = 'Book';

    @Property('DC.Identifier')
    public identifier: string = '';

    @Property('DC.Title')
    public title: string = '';

    @Property('DC.Creator')
    public creator: string = '';

    @Property('DC.Contributor')
    public contributor: string = '';

    @Property('DC.Publisher')
    public publisher: string = '';

    @Property('DC.Subject')
    public subject: string = '';

    @Property('DC.Description')
    public description: string = '';

    @Property('DC.Type')
    public type: string = '';

    @Property('DC.Date')
    public date: string = '';

    @Property('DC.Coverage')
    public coverage: string = '';

    @Property('DC.Format')
    public format: string = '';

    @Property('DC.Source')
    public source: string = '';

    @Property('DC.Language')
    public language: string = 'en';

    @Property('DC.Relation')
    public relation: string = '';

    @Property('DC.Rights')
    public rights: string = '';

    // Asset Management Properties
    @Property()
    public owner: string = '';

    @Property()
    public lendee: string = 'none'; 

    // Archival Management Properties
    @Property()
    public createdAt: string = '';

    @Property()
    public updatedAt: string = '';

    @Property()
    public status: 'open' | 'loaned' | 'locked' = 'open';

    @Property()
    public file?: string = 'placeholder'; // Link to file
}