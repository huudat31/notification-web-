import { Injectable, signal, computed } from '@angular/core';
import { TargetMode, SelectionScope } from '../model/campaign-create.model';

@Injectable()
export class CampaignTargetStore {
  // UI State
  readonly isOverlayOpen = signal<boolean>(false);
  readonly searchKeyword = signal<string>('');
  readonly selectionScope = signal<SelectionScope>('GLOBAL');

  // Selection State Engine
  readonly baseTargetRule = signal<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC'>('ALL');
  readonly includedIds = signal<Set<number>>(new Set());
  readonly excludedIds = signal<Set<number>>(new Set());

  // Auto-Detection Reactive Engine
  readonly activeTargetType = computed<TargetMode>(() => {
    const rule = this.baseTargetRule();
    const includes = this.includedIds();
    const excludes = this.excludedIds();

    if (rule === 'SPECIFIC') {
      return 'SPECIFIC';
    }

    if (excludes.size > 0 || includes.size > 0) {
      return 'RULE_BASED';
    }

    return rule;
  });

  // Actions
  setOverlayOpen(isOpen: boolean): void {
    this.isOverlayOpen.set(isOpen);
  }

  setSearchKeyword(keyword: string): void {
    this.searchKeyword.set(keyword);
  }

  setBaseTargetRule(rule: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC'): void {
    this.baseTargetRule.set(rule);
    // Reset manual selections when fundamentally changing the rule
    this.includedIds.set(new Set());
    this.excludedIds.set(new Set());
  }

  setSelectionScope(scope: SelectionScope): void {
    this.selectionScope.set(scope);
  }

  /**
   * O(1) Time Complexity Toggle
   * isBaseRuleSatisfied: e.g. If baseRule='ACTIVE' and user is 'ACTIVE' -> true
   */
  toggleUserSelection(userId: number, isBaseRuleSatisfied: boolean): void {
    const includes = new Set(this.includedIds());
    const excludes = new Set(this.excludedIds());

    if (this.baseTargetRule() === 'SPECIFIC') {
      if (includes.has(userId)) {
        includes.delete(userId);
      } else {
        includes.add(userId);
      }
      this.includedIds.set(includes);
      return;
    }

    if (isBaseRuleSatisfied) {
      if (excludes.has(userId)) {
        excludes.delete(userId); // Re-include
      } else {
        excludes.add(userId); // Exclude
      }
    } else {
      if (includes.has(userId)) {
        includes.delete(userId); // Re-exclude
      } else {
        includes.add(userId); // Include
      }
    }

    this.includedIds.set(includes);
    this.excludedIds.set(excludes);
  }
}
