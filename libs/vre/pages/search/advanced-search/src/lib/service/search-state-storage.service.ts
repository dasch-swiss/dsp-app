import { Injectable } from '@angular/core';
import {
  AdvancedSearchStateSnapshot,
  IriLabelPair,
  NodeValue,
  SearchFormsState,
  StatementElement,
  StringValue,
} from '../model';

@Injectable()
export class SearchStateStorageService {
  private readonly STORAGE_KEY_PREFIX = 'advanced-search-';

  private readonly MAX_STORED_SEARCHES = 20;

  private _statementMap = new Map<string, StatementElement>();
  private _projectUuid?: string;

  setProjectUuid(projectUuid: string): void {
    this._projectUuid = projectUuid;
  }

  private get storageKey(): string {
    return this._projectUuid ? `${this.STORAGE_KEY_PREFIX}${this._projectUuid}` : `${this.STORAGE_KEY_PREFIX}global`;
  }

  private _reconstructStatementElements(plainObjects: any[] = []): StatementElement[] {
    this._statementMap.clear();
    if (!plainObjects || plainObjects.length === 0) return [];
    return plainObjects.map(obj => this._reconstructStatement(obj));
  }

  private _reconstructStatement(obj: any): StatementElement {
    const key = obj?.id ?? JSON.stringify(obj); // ideally obj.id exists and is stable

    const cached = this._statementMap.get(key);
    if (cached) return cached;

    let subjectNode: NodeValue | undefined;
    if (obj._subjectNode) {
      subjectNode = new NodeValue(obj.id, obj._subjectNode._value);
    }

    const parentStatement = obj._parentStatement ? this._reconstructStatement(obj._parentStatement) : undefined;

    const element = new StatementElement(subjectNode, obj.statementLevel, parentStatement);
    this._statementMap.set(key, element); // important: set early enough to break cycles if needed

    element.selectedPredicate = obj._selectedPredicate;
    element.selectedOperator = obj._selectedOperator;
    element.selectedObjectNode = this.reconstructObjectNode(obj._selectedObjectNode);

    return element;
  }

  private reconstructObjectNode(objNode: any): NodeValue | StringValue | undefined {
    if (objNode?._value && typeof objNode._value === 'object' && 'iri' in objNode._value) {
      return new NodeValue(objNode.statementId, objNode._value);
    }

    if (objNode?._value && typeof objNode._value === 'string') {
      return new StringValue(objNode.statementId, objNode._value);
    }
    if (typeof objNode === 'object' && objNode.statementId) {
      return new NodeValue(objNode.statementId, objNode._value);
    }

    return undefined;
  }

  getPreviousSearchForQuery(query?: string): AdvancedSearchStateSnapshot | undefined {
    const storedSearches = localStorage.getItem(this.storageKey) || '{}';
    const previousSearchObject = query
      ? (JSON.parse(storedSearches)[query] as AdvancedSearchStateSnapshot) || ({} as AdvancedSearchStateSnapshot) // simply the first one if no query provided
      : this.getLatestSearchSnapshot() || undefined;
    return previousSearchObject
      ? {
          ...previousSearchObject,
          statementElements: this._reconstructStatementElements(previousSearchObject.statementElements),
        }
      : undefined;
  }

  getLatestSearchSnapshot(): AdvancedSearchStateSnapshot | undefined {
    const storedSearches = localStorage.getItem(this.storageKey) || '{}';
    const snapshots = Object.values(JSON.parse(storedSearches) as Record<string, AdvancedSearchStateSnapshot>);
    if (snapshots.length === 0) return undefined;

    snapshots.sort((a, b) => new Date(b.dateOfSnapshot).getTime() - new Date(a.dateOfSnapshot).getTime());
    const latestSnapshot = snapshots[0];
    return {
      ...latestSnapshot,
      statementElements: this._reconstructStatementElements(latestSnapshot.statementElements),
    };
  }

  storeSearchSnapshot(query: string, ontology: IriLabelPair, state: SearchFormsState): void {
    const snapshot: AdvancedSearchStateSnapshot = {
      selectedOntology: ontology,
      selectedResourceClass: state.selectedResourceClass,
      statementElements: state.statementElements,
      orderBy: state.orderBy,
      dateOfSnapshot: new Date().toISOString(),
    };

    const storedSearch = localStorage.getItem(this.storageKey);
    const previousSearches: Record<string, SearchFormsState> = storedSearch ? JSON.parse(storedSearch) : {};
    previousSearches[query] = snapshot;

    const keys = Object.keys(previousSearches);
    if (keys.length > this.MAX_STORED_SEARCHES) {
      // only keep the 20 most recent searches, remove the oldest if necessary
      const dates = keys.map(key => {
        const entry = previousSearches[key] as any;
        return { key, dateOfSnapshot: entry?.dateOfSnapshot || '' };
      });
      dates.sort((a, b) => a.dateOfSnapshot.localeCompare(b.dateOfSnapshot));
      delete previousSearches[dates[0].key];
    }
    localStorage.setItem(this.storageKey, JSON.stringify(previousSearches));
  }
}
