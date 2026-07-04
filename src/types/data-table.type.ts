import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export type SortState = {
  key: string;
  direction: SortDirection;
} | null;

export type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

export type PrimitiveSortValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type ColumnDef<T> = {
  id: string;
  header: ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => PrimitiveSortValue;
  width?: number | string;
  minWidth?: number;
  pinned?: "left";
  align?: "left" | "center" | "right";
};

export type ChildRowsConfig<T, C> = {
  columns: ColumnDef<C>[];
  getChildren?: (row: T) => C[] | undefined;
  fetchChildren?: (row: T) => Promise<C[]>;
  getChildId?: (child: C, index: number, parent: T) => string;
  emptyMessage?: ReactNode;
};

export type DataTableProps<T, C = never> = {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T, index: number) => string;
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  skeletonRows?: number;
  sort?: SortState;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  manualSorting?: boolean;
  pagination?: PaginationState;
  defaultPagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  manualPagination?: boolean;
  totalRows?: number;
  pageSizeOptions?: number[];
  showIndex?: boolean;
  indexHeader?: ReactNode;
  childRows?: ChildRowsConfig<T, C>;
  rowLabel?: string;
};

export type ChildLoadState<C> = {
  loading: boolean;
  data?: C[];
  error?: string;
};

export type ClassStatus = "Scheduled" | "Full" | "Cancelled";
export type BookingStatus = "Booked" | "Checked-in" | "Cancelled" | "No-show";
export type PaymentType = "One-time" | "Package" | "Membership";

export type Attendee = {
  id: string;
  memberName: string;
  paymentType: PaymentType;
  bookingStatus: BookingStatus;
};

export type FitnessClass = {
  id: string;
  className: string;
  instructor: string;
  startsAt: string;
  endsAt: string;
  enrolled: number;
  capacity: number;
  status: ClassStatus;
  attendees?: Attendee[];
};

export type Member = {
  id: string;
  name: string;
  plan: "Drop-in" | "Core" | "Unlimited" | "Corporate";
  visitsThisMonth: number;
  nextBillingDate: string;
  status: "Active" | "Paused" | "Past due";
};

export type ApiPage<T> = {
  rows: T[];
  total: number;
};

export type ViewMode = "serverClasses" | "inlineClasses" | "members";
