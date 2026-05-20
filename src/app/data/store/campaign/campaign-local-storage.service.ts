import { Injectable } from '@angular/core';
import { Campaign } from '@data/model/campaign.model';

export interface QueuedMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  actionType: 'CREATE_CAMPAIGN' | 'RETRY_NOTIFICATION';
  entityId: string;
  payload: any;
  timestamp: number;
}

interface OfflineWrapper<T> {
  value: T;
  persistedAt: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignLocalStorageService {
  private readonly DB_NAME = 'notification_enterprise_db';
  private readonly DB_VERSION = 2;
  private readonly STORE_CAMPAIGNS = 'campaigns';
  private readonly STORE_MUTATIONS = 'pending_mutations';
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours TTL

  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDb();
    this.pruneExpiredCache();
  }

  private initDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[Offline] Failed to open IndexedDB, falling back to Memory/LocalStorage');
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Upgrade migration strategy
        if (!db.objectStoreNames.contains(this.STORE_CAMPAIGNS)) {
          db.createObjectStore(this.STORE_CAMPAIGNS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.STORE_MUTATIONS)) {
          db.createObjectStore(this.STORE_MUTATIONS, { keyPath: 'id' });
        }
      };
    });
  }

  async saveCampaigns(campaigns: Campaign[]): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_CAMPAIGNS, 'readwrite');
      const store = tx.objectStore(this.STORE_CAMPAIGNS);

      // Clean old and save fresh paged content
      store.clear();
      const now = Date.now();

      campaigns.forEach(c => {
        const wrapper: OfflineWrapper<Campaign> = {
          value: c,
          persistedAt: now,
          ttl: this.CACHE_TTL_MS
        };
        store.put({ id: c.id, ...wrapper });
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      localStorage.setItem('offline_campaigns', JSON.stringify(campaigns));
    }
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_CAMPAIGNS, 'readonly');
      const store = tx.objectStore(this.STORE_CAMPAIGNS);
      const request = store.getAll();

      const wrappers = await new Promise<any[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const now = Date.now();
      const validCampaigns: Campaign[] = [];

      for (const w of wrappers) {
        if (now - w.persistedAt < w.ttl) {
          validCampaigns.push(w.value);
        } else {
          // Stale cache element eviction
          this.removeCampaign(w.id);
        }
      }

      return validCampaigns;
    } catch (e) {
      const data = localStorage.getItem('offline_campaigns');
      return data ? JSON.parse(data) : [];
    }
  }

  async saveCampaign(campaign: Campaign): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_CAMPAIGNS, 'readwrite');
      const store = tx.objectStore(this.STORE_CAMPAIGNS);

      const wrapper: OfflineWrapper<Campaign> = {
        value: campaign,
        persistedAt: Date.now(),
        ttl: this.CACHE_TTL_MS
      };

      store.put({ id: campaign.id, ...wrapper });

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      const list = await this.getAllCampaigns();
      const idx = list.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        list[idx] = campaign;
      } else {
        list.unshift(campaign);
      }
      localStorage.setItem('offline_campaigns', JSON.stringify(list));
    }
  }

  async removeCampaign(id: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_CAMPAIGNS, 'readwrite');
      const store = tx.objectStore(this.STORE_CAMPAIGNS);
      store.delete(id);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      const list = await this.getAllCampaigns();
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem('offline_campaigns', JSON.stringify(filtered));
    }
  }

  // --- Offline Mutation Queue Store Operations ---

  async getPendingMutations(): Promise<QueuedMutation[]> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_MUTATIONS, 'readonly');
      const store = tx.objectStore(this.STORE_MUTATIONS);
      const request = store.getAll();

      return new Promise<QueuedMutation[]>((resolve, reject) => {
        request.onsuccess = () => {
          const list = (request.result || []) as QueuedMutation[];
          resolve(list.sort((a, b) => a.timestamp - b.timestamp));
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      const q = localStorage.getItem('pending_mutations_queue');
      return q ? JSON.parse(q) : [];
    }
  }

  async enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<string> {
    const id = `mut_${crypto.randomUUID()}`;
    const item: QueuedMutation = {
      ...mutation,
      id,
      timestamp: Date.now()
    };

    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(this.STORE_MUTATIONS);
      store.put(item);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Compact queue dynamically
      await this.compactQueue();
      return id;
    } catch {
      const queue = await this.getPendingMutations();
      queue.push(item);
      localStorage.setItem('pending_mutations_queue', JSON.stringify(queue));
      return id;
    }
  }

  async dequeueMutation(id: string): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(this.STORE_MUTATIONS);
      store.delete(id);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const queue = await this.getPendingMutations();
      const filtered = queue.filter(x => x.id !== id);
      localStorage.setItem('pending_mutations_queue', JSON.stringify(filtered));
    }
  }

  private async compactQueue(): Promise<void> {
    const queue = await this.getPendingMutations();
    const compactedMap = new Map<string, QueuedMutation>();
    const toRemoveIds: string[] = [];

    queue.forEach(mut => {
      const key = mut.entityId;
      const existing = compactedMap.get(key);

      if (!existing) {
        compactedMap.set(key, mut);
        return;
      }

      // Compact CREATE + DELETE -> Eliminate both
      if (existing.type === 'CREATE' && mut.type === 'DELETE') {
        compactedMap.delete(key);
        toRemoveIds.push(existing.id, mut.id);
      } 
      // Compact CREATE + UPDATE -> Merge payload into CREATE
      else if (existing.type === 'CREATE' && mut.type === 'UPDATE') {
        existing.payload = { ...existing.payload, ...mut.payload };
        toRemoveIds.push(mut.id);
      } 
      // Compact UPDATE + DELETE -> Shift action to DELETE only
      else if (existing.type === 'UPDATE' && mut.type === 'DELETE') {
        mut.type = 'DELETE';
        compactedMap.set(key, mut);
        toRemoveIds.push(existing.id);
      } 
      // Compact UPDATE + UPDATE -> Merge changes into first UPDATE
      else if (existing.type === 'UPDATE' && mut.type === 'UPDATE') {
        existing.payload = { ...existing.payload, ...mut.payload };
        toRemoveIds.push(mut.id);
      }
    });

    // Remove compacted/cancelled records from IndexedDB
    if (toRemoveIds.length > 0) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction(this.STORE_MUTATIONS, 'readwrite');
        const store = tx.objectStore(this.STORE_MUTATIONS);
        toRemoveIds.forEach(id => store.delete(id));
        
        // Re-put the updated parent records
        for (const item of compactedMap.values()) {
          store.put(item);
        }
      } catch (e) {
        const compactedList = Array.from(compactedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        localStorage.setItem('pending_mutations_queue', JSON.stringify(compactedList));
      }
    }
  }

  private async pruneExpiredCache(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_CAMPAIGNS, 'readwrite');
      const store = tx.objectStore(this.STORE_CAMPAIGNS);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = Date.now();
        const wrappers = request.result || [];
        wrappers.forEach(w => {
          if (now - w.persistedAt > w.ttl) {
            store.delete(w.id);
          }
        });
      };
    } catch {
      // Done silently
    }
  }
}
