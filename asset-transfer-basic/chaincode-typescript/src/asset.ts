/*
  SPDX-License-Identifier: Apache-2.0
*/

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {
  @Property()
  public docType!: string;

  @Property()
  public _identifier: string = '';

  @Property()
  public metadata: string = '';

  @Property()
  public owner: string = '';

  @Property()
  public lendee: string = 'none';

  @Property()
  public createdAt: string = '';

  @Property()
  public updatedAt: string = '';

  @Property()
  public status: 'open' | 'loaned' | 'locked' = 'open';

  @Property()
  public licenseEndsAt: string = '';

  @Property()
  public file: string = 'placeholder';

  constructor(identifier: string) {
    this._identifier = identifier;
    this.metadata = this.buildMetadataLink(identifier);
  }

  private buildMetadataLink(identifier: string): string {
    if (identifier.startsWith('DOI_')) {
      // For DOI use Crossref API
      const doi = identifier.replace('DOI_', '').replace(/\//g, '%2F');
      return `https://api.crossref.org/works/${doi}`;
    } else {
      // OpenLibrary API for ISBN, OCLC, LCCN, OLID
      const [type, value] = identifier.split('_');
      return `https://openlibrary.org/api/books?bibkeys=${type}:${value}&format=json`;
    }
  }
}