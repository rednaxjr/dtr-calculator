export type FieldKey = 'amIn' | 'amOut' | 'pmIn' | 'pmOut' | 'otIn' | 'otOut';
export type Session = 'AM' | 'PM' | 'OT';
export type FieldStatus = 'late' | 'ontime' | 'blank-required' | 'blank-optional' | 'neutral';

export interface FieldDef {
  key: FieldKey;
  label: string;
  session: Session;
  required: boolean;
  lateAfter: number | null;
  fillValue?: string;
}

export interface StatusMeta {
  icon: string;
  locked: boolean;
  halfDay?: boolean;
  tooltip: string;
  badgeClass: string;
  rowClass: string;
}
