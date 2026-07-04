"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAttendees,
  fetchClasses,
  fetchMembers
} from "@/lib/api/mock.api";
import { inlineClasses } from "@/lib/api/mock-data";
import type {
  Attendee,
  ColumnDef,
  FitnessClass,
  Member,
  PaginationState,
  SortState
} from "@/types/data-table.type";

const initialPagination: PaginationState = {
  pageIndex: 0,
  pageSize: 8
};

export function useServerClassesTable() {
  const [rows, setRows] = useState<FitnessClass[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sort, setSort] = useState<SortState>({
    key: "time",
    direction: "asc"
  });
  const [pagination, setPagination] =
    useState<PaginationState>(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceError, setForceError] = useState(false);
  const classColumns = useClassColumns();
  const attendeeColumns = useAttendeeColumns();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (forceError) {
      window.setTimeout(() => {
        if (active) {
          setRows([]);
          setTotalRows(0);
          setError("The timetable endpoint returned a simulated error.");
          setLoading(false);
        }
      }, 420);
      return () => {
        active = false;
      };
    }

    fetchClasses({ pagination, sort })
      .then((response) => {
        if (!active) {
          return;
        }
        setRows(response.rows);
        setTotalRows(response.total);
      })
      .catch(() => {
        if (active) {
          setError("Timetable data could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [forceError, pagination, sort]);

  return {
    rows,
    totalRows,
    sort,
    setSort,
    pagination,
    setPagination,
    loading,
    error,
    forceError,
    setForceError,
    reset: () => {
      setPagination({ ...initialPagination });
      setSort({ key: "time", direction: "asc" });
    },
    classColumns,
    attendeeColumns,
    fetchAttendees
  };
}

export function useInlineClassesTable() {
  return {
    rows: inlineClasses,
    classColumns: useClassColumns(),
    attendeeColumns: useAttendeeColumns()
  };
}

export function useMembersTable() {
  const [rows, setRows] = useState<Member[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sort, setSort] = useState<SortState>({
    key: "name",
    direction: "asc"
  });
  const [pagination, setPagination] =
    useState<PaginationState>(initialPagination);
  const [loading, setLoading] = useState(true);
  const columns = useMemberColumns();

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchMembers({ pagination, sort })
      .then((response) => {
        if (active) {
          setRows(response.rows);
          setTotalRows(response.total);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pagination, sort]);

  return {
    rows,
    totalRows,
    sort,
    setSort,
    pagination,
    setPagination,
    loading,
    columns
  };
}

function useClassColumns(): ColumnDef<FitnessClass>[] {
  return useMemo(
    () => [
      {
        id: "className",
        header: "Class",
        accessor: "className",
        sortable: true,
        pinned: "left",
        width: 220,
        cell: (row) => (
          <span className="classCell">
            <span>{row.className}</span>
            <span className="classCode">{row.id}</span>
          </span>
        )
      },
      {
        id: "instructor",
        header: "Instructor",
        accessor: "instructor",
        sortable: true,
        width: 170
      },
      {
        id: "time",
        header: "Time",
        sortable: true,
        width: 160,
        sortAccessor: (row) => row.startsAt,
        cell: (row) => `${row.startsAt} - ${row.endsAt}`
      },
      {
        id: "attendance",
        header: "Attendance",
        sortable: true,
        align: "right",
        width: 140,
        sortAccessor: (row) => row.enrolled,
        cell: (row) => `${row.enrolled} / ${row.capacity}`
      },
      {
        id: "status",
        header: "Status",
        accessor: "status",
        sortable: true,
        width: 150,
        cell: (row) => <StatusBadge status={row.status} />
      }
    ],
    []
  );
}

function useAttendeeColumns(): ColumnDef<Attendee>[] {
  return useMemo(
    () => [
      {
        id: "memberName",
        header: "Member",
        accessor: "memberName",
        width: 220
      },
      {
        id: "paymentType",
        header: "Payment",
        accessor: "paymentType",
        width: 160
      },
      {
        id: "bookingStatus",
        header: "Booking",
        width: 160,
        cell: (row) => <StatusBadge status={row.bookingStatus} />
      }
    ],
    []
  );
}

function useMemberColumns(): ColumnDef<Member>[] {
  return useMemo(
    () => [
      {
        id: "name",
        header: "Member",
        accessor: "name",
        sortable: true,
        pinned: "left",
        width: 220
      },
      {
        id: "plan",
        header: "Plan",
        accessor: "plan",
        sortable: true,
        width: 150
      },
      {
        id: "visitsThisMonth",
        header: "Visits",
        accessor: "visitsThisMonth",
        sortable: true,
        align: "center",
        width: 120
      },
      {
        id: "nextBillingDate",
        header: "Next billing",
        accessor: "nextBillingDate",
        sortable: true,
        width: 170
      },
      {
        id: "status",
        header: "Status",
        accessor: "status",
        sortable: true,
        width: 140,
        cell: (row) => <StatusBadge status={row.status} />
      }
    ],
    []
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`statusBadge ${tone}`}>{status}</span>;
}
