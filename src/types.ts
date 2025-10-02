import { Database } from '../database.types';

export type RepairItem = Database['public']['Tables']['repair_items']['Row'];
export type Employee = Database['public']['Tables']['employees']['Row'];
export type Wire = Database['public']['Tables']['wires']['Row'];
export type Motor = Database['public']['Tables']['motors']['Row'];
export type Bearing = Database['public']['Tables']['bearings']['Row'];
export type Counterparty = Database['public']['Tables']['counterparties']['Row'];
export type UpdDocument = Database['public']['Tables']['upd_documents']['Row'];
export type SavedPosition = Database['public']['Tables']['saved_positions']['Row'] & { url?: string; }; // Добавлено url
export type SavedPositionItem = Database['public']['Tables']['saved_position_items']['Row'];
export type IndividualEmployee = Database['public']['Tables']['individual_employees']['Row'];
export type Template = Database['public']['Tables']['templates']['Row']; // New type
export type TemplateItem = Database['public']['Tables']['template_items']['Row']; // New type

export interface Position {
  id: string;
  originalId?: string; // Optional, for linking to saved_positions
  service: string;
  positionNumber: number;
  items: RepairItem[];
  totalPrice: number;
  totalIncome: number;
  totalExpense: number;
}

export interface GroupedRepairItem {
  id: string; // A unique ID for the grouped item (e.g., first item's ID)
  positionName: string;
  incomeExpenseType: 'Доходы' | 'Расходы';
  groupedIds: string[]; // IDs of all items in this group
  quantity: number; // Total quantity of items in this group
  revenue: number; // Total revenue for this group
  sumWithoutVAT: number; // Total sum without VAT for this group
  vatAmount: number; // Total VAT amount for this group
  workType: string; // Work type for this group
  analytics8: string; // Analytics8 for this group
}
