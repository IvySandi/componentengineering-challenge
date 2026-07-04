"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import {
  useInlineClassesTable,
  useMembersTable,
  useServerClassesTable
} from "@/hooks/useDataTableDemo";
import type {
  Attendee,
  FitnessClass,
  Member,
  ViewMode
} from "@/types/data-table.type";

export default function Home() {
  const [view, setView] = useState<ViewMode>("serverClasses");

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Rezerv component challenge</p>
          <h1>Studio timetable operations</h1>
        </div>
        <nav className="segmentedControl" aria-label="Table demos">
          <button
            type="button"
            className={view === "serverClasses" ? "active" : ""}
            onClick={() => setView("serverClasses")}
          >
            Timetable
          </button>
          <button
            type="button"
            className={view === "inlineClasses" ? "active" : ""}
            onClick={() => setView("inlineClasses")}
          >
            Inline
          </button>
          <button
            type="button"
            className={view === "members" ? "active" : ""}
            onClick={() => setView("members")}
          >
            Members
          </button>
        </nav>
      </header>

      {view === "serverClasses" ? <ServerClassesView /> : null}
      {view === "inlineClasses" ? <InlineClassesView /> : null}
      {view === "members" ? <MembersView /> : null}
    </main>
  );
}

function ServerClassesView() {
  const table = useServerClassesTable();

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Class timetable</h2>
          <p>Server-side sort and pagination with on-demand attendee rows.</p>
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={() => table.setForceError((value) => !value)}
          >
            {table.forceError ? "Restore" : "Simulate error"}
          </button>
          <button type="button" onClick={table.reset}>
            Reset
          </button>
        </div>
      </div>

      <DataTable<FitnessClass, Attendee>
        data={table.rows}
        columns={table.classColumns}
        getRowId={(row) => row.id}
        loading={table.loading}
        error={table.error}
        sort={table.sort}
        onSortChange={table.setSort}
        manualSorting
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        manualPagination
        totalRows={table.totalRows}
        childRows={{
          columns: table.attendeeColumns,
          fetchChildren: (row) => table.fetchAttendees(row.id),
          getChildId: (child) => child.id,
          emptyMessage: "No attendees booked yet."
        }}
        rowLabel="class"
      />
    </section>
  );
}

function InlineClassesView() {
  const table = useInlineClassesTable();

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Inline attendee expansion</h2>
          <p>Client-side sort and pagination over parent rows with bundled children.</p>
        </div>
      </div>

      <DataTable<FitnessClass, Attendee>
        data={table.rows}
        columns={table.classColumns}
        getRowId={(row) => row.id}
        defaultSort={{ key: "className", direction: "asc" }}
        defaultPagination={{ pageIndex: 0, pageSize: 5 }}
        pageSizeOptions={[5, 8, 10]}
        childRows={{
          columns: table.attendeeColumns,
          getChildren: (row) => row.attendees,
          getChildId: (child) => child.id,
          emptyMessage: "No attendees booked yet."
        }}
        rowLabel="class"
      />
    </section>
  );
}

function MembersView() {
  const table = useMembersTable();

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>Member billing list</h2>
          <p>A second row shape using the same typed table API.</p>
        </div>
      </div>

      <DataTable<Member>
        data={table.rows}
        columns={table.columns}
        getRowId={(row) => row.id}
        loading={table.loading}
        sort={table.sort}
        onSortChange={table.setSort}
        manualSorting
        pagination={table.pagination}
        onPaginationChange={table.setPagination}
        manualPagination
        totalRows={table.totalRows}
        rowLabel="member"
      />
    </section>
  );
}
