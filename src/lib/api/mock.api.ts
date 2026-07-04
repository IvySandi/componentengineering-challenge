import type {
  ApiPage,
  Attendee,
  FitnessClass,
  Member,
  PaginationState,
  SortState
} from "@/types/data-table.type";
import { allClasses, allMembers, createAttendees } from "./mock-data";

export async function fetchClasses({
  pagination,
  sort
}: {
  pagination: PaginationState;
  sort: SortState;
}): Promise<ApiPage<FitnessClass>> {
  await delay(520);
  return pageRows(allClasses, pagination, sort, classSortValue);
}

export async function fetchAttendees(classId: string): Promise<Attendee[]> {
  await delay(420 + (Number(classId.replace("class-", "")) % 4) * 120);

  if (classId === "class-13") {
    throw new Error("Attendees are temporarily unavailable for this class.");
  }

  const classIndex = Number(classId.replace("class-", "")) - 1;
  const count = 2 + (classIndex % 7);
  return createAttendees(classIndex, count);
}

export async function fetchMembers({pagination,sort}
  : { pagination: PaginationState; sort: SortState;}): Promise<ApiPage<Member>> {
  await delay(460);
  return pageRows(allMembers, pagination, sort, memberSortValue);
}

function pageRows<T>(
  rows: T[],
  pagination: PaginationState,
  sort: SortState,
  getValue: (row: T, key: string) => string | number
): ApiPage<T> {
  const sortedRows = sort
    ? [...rows].sort((a, b) => {
        const result = String(getValue(a, sort.key)).localeCompare(
          String(getValue(b, sort.key)),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
        return sort.direction === "asc" ? result : -result;
      })
    : rows;

  const pageIndex = Math.max(0, pagination.pageIndex);
  const start = pageIndex * pagination.pageSize;
  return {
    rows: sortedRows.slice(start, start + pagination.pageSize),
    total: rows.length
  };
}

function classSortValue(row: FitnessClass, key: string) {
  const values: Record<string, string | number> = {
    className: row.className,
    instructor: row.instructor,
    time: row.startsAt,
    attendance: row.enrolled,
    status: row.status
  };

  return values[key] ?? "";
}

function memberSortValue(row: Member, key: string) {
  const values: Record<string, string | number> = {
    name: row.name,
    plan: row.plan,
    visitsThisMonth: row.visitsThisMonth,
    nextBillingDate: row.nextBillingDate,
    status: row.status
  };

  return values[key] ?? "";
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
