import { Injectable } from '@angular/core';
import { CampaignFormValue, CreateCampaignPayload, SelectionState } from '../model/campaign-create.model';

@Injectable({ providedIn: 'root' })
export class CampaignPayloadBuilder {
  buildCreatePayload(form: CampaignFormValue, selectionState: SelectionState): CreateCampaignPayload {
    const payload: CreateCampaignPayload = {
      ...form,
      targetType: selectionState.targetType
    };

    if (selectionState.targetType === 'SPECIFIC') {
      payload.targetUserIds = Array.from(selectionState.includedIds);
    } else if (selectionState.targetType === 'RULE_BASED') {
      // Must cast baseRule to avoid undefined type error, handled logically beforehand.
      payload.baseRule = selectionState.baseRule as any;
      payload.includedUserIds = Array.from(selectionState.includedIds);
      payload.excludedUserIds = Array.from(selectionState.excludedIds);
    }

    return payload;
  }
}
