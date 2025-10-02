export interface UpdDocument {
  id: string;
  created_at: string;
  counterparty_name: string;
  document_name: string;
  is_active: boolean;
  document_date: string; // New field for the actual document date
}

export interface RepairItem {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  is_active: boolean;
  user_id: string;
  upd_document_id: string | null;
  // Existing fields from the original RepairItem
  positionName: string;
  analytics1: string;
  analytics2: string;
  analytics3: string;
  analytics4: string;
  analytics5: string;
  analytics6: string;
  analytics7: string;
  analytics8: string;
  incomeExpenseType: 'Доходы' | 'Расходы';
  revenue: number;
  sumWithoutVAT: number;
  vatAmount: number;
  salaryGoods: string;
  year: number;
  month: number;
  quarter: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  uniqueKey: string;
  workType: string;
}

export interface GroupedRepairItems {
  [key: string]: RepairItem[];
}

export interface GroupedRepairItem {
  positionName: string;
  quantity: number;
  totalRevenue: number;
  // Add other fields if they are used in EmployeeReplacer
  // For example, if you want to pre-select the job title, you might need it here
  // job_title?: string; // Assuming it might be derived or added later
}

export interface Position {
  id: string;
  originalId?: string; // Optional: for linking to saved_positions when editing
  service: string;
  positionNumber: number;
  items: RepairItem[];
  totalPrice: number;
  totalIncome: number;
  totalExpense: number;
}

export interface Counterparty {
  id: string;
  name: string;
  inn: string | null;
  kpp: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedPosition {
  id: string;
  created_at: string;
  user_id: string;
  service: string;
  position_number: number;
  total_price: number;
  total_income: number;
  total_expense: number;
  items_count: number;
  export_date: string;
  counterparty_id: string | null;
  counterparty_name: string | null;
  document_new: string | null;
}

export interface SavedPositionItem {
  id: string;
  created_at: string;
  position_id: string;
  item_data: RepairItem;
  position_name: string;
  income_expense_type: 'Доходы' | 'Расходы';
}

export interface Bearing {
  id: string;
  designation: string;
  price_per_unit: number;
  is_active: boolean;
  created_at: string;
}

export interface Motor {
  id: string;
  name: string;
  power_kw: number;
  rpm: number;
  price_per_unit: number;
  is_active: boolean;
  created_at: string;
}

export interface Wire {
  id: string;
  brand: string;
  cross_section: number;
  price_per_meter: number;
  is_active: boolean;
  created_at: string;
}

export interface JobPosition {
  id: string;
  name: string; // e.g., "Слесарь"
  hourly_rate: number; // Default rate for this position
  is_active: boolean;
  created_at: string;
  description: string | null; // Description of the job position
}

export interface IndividualEmployee {
  id: string;
  created_at: string;
  full_name: string; // e.g., "Иванов И.И."
  job_title: string; // e.g., "Слесарь" (text field)
  hourly_rate: number; // Specific rate for this individual
  is_active: boolean;
  description: string | null; // Additional details about the individual
}

export interface Template {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  description: string | null;
}

export interface TemplateItem {
  id: string;
  created_at: string;
  template_id: string;
  item_data: RepairItem;
  original_position_id: string | null; // Changed from uuid to string
  original_service_name: string | null;
}
