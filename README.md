# Rezerv Component Engineering Challenge

Reusable, typed data table for a fitness studio timetable dashboard. The app is built with Next.js, React, and TypeScript, with mock API calls with client-side/server-side pagination, client-side/server-side sorting, and on-demand child-row loading.

# Tech Stack

- Next.js App Router
- React and TypeScript
- CSS, SCSS


# Getting Started

npm install


# Start the local development server:

npm run dev

Open [http://localhost:3000] in your browser.

# Scripts

```bash
npm run dev     
npm run build    
npm run start    
npm run lint     
```


# What Is Included

- `Timetable`: class timetable using server-side sorting and server-side pagination. Attendees are fetched lazily when a class is expanded.
- `Inline`: same class data shape using client-side sorting and pagination with attendee rows bundled directly into each parent row.
- `Members`: a differently shaped dataset using the same generic table API in controlled server mode.

# Component API

The table is implemented in `src/components/ui/DataTable.tsx` and is generic over parent and child rows:

```tsx
<DataTable<FitnessClass, Attendee>
  data={rows}
  columns={classColumns}
  getRowId={(row) => row.id}
  sort={sort}
  onSortChange={setSort}
  manualSorting
  pagination={pagination}
  onPaginationChange={setPagination}
  manualPagination
  totalRows={totalRows}
  childRows={{
    columns: attendeeColumns,
    fetchChildren: (row) => fetchAttendees(row.id)
  }}
/>
```

Column definitions describe the table instead of hard-coding fields:

- `id`: stable column key, also used for sort events.
- `header`: rendered header label.
- `accessor`: property key or function for simple cells.
- `cell`: custom cell renderer.
- `sortable`: enables the header sort toggle.
- `sortAccessor`: local sort value when a custom cell needs separate sort data.
- `width` and `minWidth`: stable layout sizing.
- `pinned`: pins a column to the left.
- `align`: left, center, or right alignment.

# Client vs Server Strategy

Sorting and pagination support both uncontrolled and controlled modes.

Client mode:

- The table owns sort/page state and transforms the full dataset locally.
- Used by the `Inline` demo.

Server mode:

- Using `sort`, `onSortChange`, `manualSorting`, `pagination`, `onPaginationChange`, `manualPagination`, and `totalRows`.
- The table include state changes and renders the page supplied by the parent.
- Static mock datasets are written in `src/lib/api/mock-data.ts`.
- Mock API functions in `src/lib/api/mock.api.ts` apply sorting, slicing, total counts, and latency.
- Used by `Timetable` and `Members`.


# Expandable Rows

Both expansion modes use the same `childRows` API:

- Inline mode uses `getChildren(row)` for children already present on the parent row.
- On-demand mode uses `fetchChildren(row)`, tracks per-row loading/error state, and offers retry for failed child fetches.

Expanded content spans the full table width and uses a max-height/opacity transition. Empty child lists, loading rows, and fetch errors have distinct states.

# Sticky Column

Pinned columns use CSS `position: sticky` and a left offset that accounts for the expand control column. The scroll container tracks horizontal scroll and adds a divider shadow when content passes underneath the pinned column. The table keeps horizontal scrolling on narrow viewports so the pinned class/member column remains usable.

# State Management

Local React state is used for this assessment because table state is view-local and serializable:

- Parent views own controlled server state.
- I kept expansion state inside the table because it's purely a UI concern. This lets parent pages focus only on data fetching and server state.
- Keeps fetch results up to date when sort/page changes quickly.
- Demo-specific state, column definitions, and data loading are grouped in `src/hooks/useDataTableDemo.tsx`.
- Shared row and table contracts are grouped in `src/types/data-table.type.ts`.


# Tradeoffs And Assumptions

- The mock API lives in the browser for simplicity, but its shape mirrors page/sort endpoints.
- I limited sorting to a single active column since that's sufficient for the mock API and keeps the component API simpler. 
- Child rows render as a nested grid inside the expanded panel rather than additional table body rows, keeping the parent table generic and accessible.
- I considered virtualization, but decided not to include it because the server-side examples already paginate the data. Adding virtualization would increase complexity without providing much benefit for this assessment.
