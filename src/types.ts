export type ColumnType = 'text' | 'select' | 'schedule';

export interface SelectOption {
  id: string;
  text: string;
  bgColor: string;   // hex or tailwind color class
  textColor: string; // hex or tailwind color class
}

export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[]; // only for 'select' type
}

export type ScheduleStatus = string;

export interface ScheduleValue {
  [dayId: string]: {
    [hour: string]: ScheduleStatus;
  };
}

export type CellValue = string | ScheduleValue;

export interface RowData {
  id: string;
  dayId: 'vendredi' | 'samedi' | 'dimanche';
  cells: {
    [columnId: string]: CellValue;
  };
}

export interface BoardState {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  columns: ColumnDefinition[];
  rows: RowData[];
}

export const DEFAULT_HOURS = [
  '08h00',
  '09h00',
  '10h00',
  '11h00',
  '12h00',
  '13h00',
  '14h00'
];

export const DAYS = [
  { id: 'vendredi' as const, label: 'Vendredi 09' },
  { id: 'samedi' as const, label: 'Samedi 10' },
  { id: 'dimanche' as const, label: 'Dimanche 11' }
];
