export type TargetMode = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SPECIFIC' | 'RULE_BASED';

export type SelectionScope = 'GLOBAL' | 'FILTERED_RESULT' | 'CURRENT_PAGE';

export interface CampaignFormValue {
  name: string;
  channel: ('EMAIL' | 'PUSH' | 'SMS')[];
  ratePerHour: number;
  templateName?: string | null;
  pushTitle?: string;
  pushBody?: string;
  pushActionUrl?: string;
  scheduledTime: string;
  endTime?: string | null;
}

export interface CreateCampaignPayload {
  name: string;
  targetType: TargetMode;
  baseRule?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  includedUserIds?: number[];
  excludedUserIds?: number[];
  targetUserIds?: number[]; // Only for SPECIFIC
  channel: ('EMAIL' | 'PUSH' | 'SMS')[];
  ratePerHour: number;
  templateName?: string | null;
  pushTitle?: string;
  pushBody?: string;
  pushActionUrl?: string;
  scheduledTime: string;
  endTime?: string | null;
}

export interface SelectionState {
  targetType: TargetMode;
  baseRule: 'ALL' | 'ACTIVE' | 'INACTIVE' | null;
  includedIds: Set<number>;
  excludedIds: Set<number>;
}
