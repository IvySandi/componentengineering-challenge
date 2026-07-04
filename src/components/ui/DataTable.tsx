"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type {
  ChildLoadState,
  ChildRowsConfig,
  ColumnDef,
  DataTableProps,
  PaginationState,
  PrimitiveSortValue,
  SortState
} from "@/types/data-table.type";

const defaultPagination: PaginationState = {
  pageIndex: 0,
  pageSize: 8
};

const expanderColumnWidth = 48;
const indexColumnWidth = 64;

export function DataTable<T, C = never>({
  data,
  columns,
  getRowId,
  loading = false,
  error,
  emptyMessage = "No records found.",
  skeletonRows = 6,
  sort,
  defaultSort = null,
  onSortChange,
  manualSorting = false,
  pagination,
  defaultPagination: defaultPaginationProp = defaultPagination,
  onPaginationChange,
  manualPagination = false,
  totalRows,
  pageSizeOptions = [5, 8, 10, 20],
  showIndex = true,
  indexHeader = "No.",
  childRows,
  rowLabel = "row"
}: DataTableProps<T, C>) {
  const [internalSort, setInternalSort] = useState<SortState>(defaultSort);
  const [internalPagination, setInternalPagination] = useState<PaginationState>(defaultPaginationProp);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [childState, setChildState] = useState<Record<string, ChildLoadState<C>>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSort = sort !== undefined ? sort : internalSort;
  const activePagination = pagination !== undefined ? pagination : internalPagination;
  const canExpand = Boolean(childRows);
  const utilityColumnsWidth =
    (canExpand ? expanderColumnWidth : 0) +
    (showIndex ? indexColumnWidth : 0);
  const pinnedOffset = utilityColumnsWidth;

  const tableLayout = useMemo(() => {
    const columnTracks = columns.map((column) => getColumnTrack(column));
    const minWidth =
      columns.reduce((total, column) => total + getColumnMinWidth(column), 0) +
      utilityColumnsWidth;
    const utilityTracks = [
      canExpand ? `${expanderColumnWidth}px` : "",
      showIndex ? `${indexColumnWidth}px` : ""
    ].filter(Boolean);

    return {
      gridTemplateColumns: [...utilityTracks, ...columnTracks].join(" "),
      minWidth
    };
  }, [canExpand, columns, showIndex, utilityColumnsWidth]);

  const sortedData = useMemo(() => {
    if (manualSorting || !activeSort) {
      return data;
    }

    const sortColumn = columns.find((column) => column.id === activeSort.key);
    if (!sortColumn || !sortColumn.sortable) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);
      const result = compareSortValues(aValue, bValue);
      return activeSort.direction === "asc" ? result : -result;
    });
  }, [activeSort, columns, data, manualSorting]);

  const resolvedTotalRows = manualPagination
    ? totalRows ?? data.length
    : sortedData.length;
  const totalPages = Math.max(
    1,
    Math.ceil(resolvedTotalRows / activePagination.pageSize)
  );
  const safePageIndex = Math.min(
    Math.max(activePagination.pageIndex, 0),
    totalPages - 1
  );

  const pageData = useMemo(() => {
    if (manualPagination) {
      return sortedData;
    }

    const start = safePageIndex * activePagination.pageSize;
    return sortedData.slice(start, start + activePagination.pageSize);
  }, [activePagination.pageSize, manualPagination, safePageIndex, sortedData]);

  useEffect(() => {
    if (safePageIndex !== activePagination.pageIndex) {
      setPagination({ ...activePagination, pageIndex: safePageIndex });
    }
  }, [activePagination, safePageIndex]);

  function setSort(nextSort: SortState) {
    if (sort === undefined) {
      setInternalSort(nextSort);
    }
    onSortChange?.(nextSort);
  }

  function setPagination(nextPagination: PaginationState) {
    const normalized = {
      pageIndex: Math.max(0, nextPagination.pageIndex),
      pageSize: nextPagination.pageSize
    };

    if (pagination === undefined) {
      setInternalPagination(normalized);
    }
    onPaginationChange?.(normalized);
  }

  function handleSort(column: ColumnDef<T>) {
    if (!column.sortable) {
      return;
    }

    let nextSort: SortState = { key: column.id, direction: "asc" };
    if (activeSort?.key === column.id && activeSort.direction === "asc") {
      nextSort = { key: column.id, direction: "desc" };
    } else if (activeSort?.key === column.id && activeSort.direction === "desc") {
      nextSort = null;
    }

    setPagination({ ...activePagination, pageIndex: 0 });
    setSort(nextSort);
  }

  function handleExpand(row: T, rowId: string) {
    const next = new Set(expandedRows);
    if (next.has(rowId)) {
      next.delete(rowId);
      setExpandedRows(next);
      return;
    }

    next.add(rowId);
    setExpandedRows(next);

    if (
      childRows?.fetchChildren &&
      !childRows.getChildren?.(row)?.length &&
      !childState[rowId]
    ) {
      setChildState((current) => ({
        ...current,
        [rowId]: { loading: true }
      }));

      childRows
        .fetchChildren(row)
        .then((children) => {
          setChildState((current) => ({
            ...current,
            [rowId]: { loading: false, data: children }
          }));
        })
        .catch((loadError: unknown) => {
          setChildState((current) => ({
            ...current,
            [rowId]: {
              loading: false,
              error:
                loadError instanceof Error
                  ? loadError.message
                  : "Child rows could not be loaded."
            }
          }));
        });
    }
  }

  function retryChildren(row: T, rowId: string) {
    setChildState((current) => {
      const next = { ...current };
      delete next[rowId];
      return next;
    });
    const nextExpanded = new Set(expandedRows);
    nextExpanded.delete(rowId);
    setExpandedRows(nextExpanded);
    window.requestAnimationFrame(() => handleExpand(row, rowId));
  }

  const visibleColumnCount =
    columns.length + (canExpand ? 1 : 0) + (showIndex ? 1 : 0);

  return (
    <section
      className={`tableShell ${canExpand ? "hasExpander" : ""}`}
      style={{ "--pinned-offset": `${pinnedOffset}px` } as CSSProperties}
      aria-busy={loading}
    >
      <div
        className={`tableScroll ${isScrolled ? "isScrolled" : ""}`}
        ref={scrollRef}
        onScroll={(event) => {
          setIsScrolled(event.currentTarget.scrollLeft > 0);
        }}
      >
        <table className="dataTable" style={{ minWidth: tableLayout.minWidth }}>
          <thead>
            <tr style={{ gridTemplateColumns: tableLayout.gridTemplateColumns }}>
              {canExpand ? (
                <th className="expanderHeader" aria-label="Expand rows" />
              ) : null}
              {showIndex ? <th className="indexHeader">{indexHeader}</th> : null}
              {columns.map((column) => {
                const sortActive = activeSort?.key === column.id;
                return (
                  <th
                    key={column.id}
                    className={columnClassName(column)}
                    style={columnStyle(column)}
                    aria-sort={
                      sortActive
                        ? activeSort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {column.sortable ? (
                      <button
                        className="sortButton"
                        type="button"
                        onClick={() => handleSort(column)}
                      >
                        <span>{column.header}</span>
                        <span className={`sortGlyph ${sortActive ? "active" : ""}`}>
                          {sortActive
                            ? activeSort.direction === "asc"
                              ? "^"
                              : "v"
                            : "-"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr className="stateRow">
                <td colSpan={visibleColumnCount}>
                  <div className="stateBox errorState">{error}</div>
                </td>
              </tr>
            ) : loading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <tr
                  className="skeletonRow"
                  key={`skeleton-${index}`}
                  style={{ gridTemplateColumns: tableLayout.gridTemplateColumns }}
                >
                  {canExpand ? (
                    <td className="expanderCell">
                      <span className="skeletonDot" />
                    </td>
                  ) : null}
                  {showIndex ? (
                    <td className="indexCell">
                      <span
                        className="skeletonLine"
                        style={{ width: "42%" }}
                      />
                    </td>
                  ) : null}
                  {columns.map((column, columnIndex) => (
                    <td
                      className={columnClassName(column)}
                      key={column.id}
                      style={columnStyle(column)}
                    >
                      <span
                        className="skeletonLine"
                        style={{ width: `${72 - (columnIndex % 3) * 12}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageData.length === 0 ? (
              <tr className="stateRow">
                <td colSpan={visibleColumnCount}>
                  <div className="stateBox">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex);
                const expanded = expandedRows.has(rowId);
                const displayIndex =
                  safePageIndex * activePagination.pageSize + rowIndex + 1;

                return (
                  <Fragment key={rowId}>
                    <tr
                      className={`bodyRow ${expanded ? "expanded" : ""}`}
                      style={{ gridTemplateColumns: tableLayout.gridTemplateColumns }}
                    >
                      {canExpand ? (
                        <td className="expanderCell">
                          <button
                            className="iconButton"
                            type="button"
                            onClick={() => handleExpand(row, rowId)}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Collapse" : "Expand"} ${rowLabel}`}
                          >
                            <span>{expanded ? "-" : "+"}</span>
                          </button>
                        </td>
                      ) : null}
                      {showIndex ? (
                        <td className="indexCell">{displayIndex}</td>
                      ) : null}
                      {columns.map((column) => (
                        <td
                          className={columnClassName(column)}
                          key={column.id}
                          style={columnStyle(column)}
                        >
                          {renderCell(row, column)}
                        </td>
                      ))}
                    </tr>
                    {canExpand ? (
                      <tr className={`expandedPanelRow ${expanded ? "open" : ""}`}>
                        <td colSpan={visibleColumnCount}>
                          <div className="expandedPanel">
                            {expanded ? (
                              <ChildRows
                                childRows={childRows}
                                parent={row}
                                parentId={rowId}
                                state={childState[rowId]}
                                onRetry={() => retryChildren(row, rowId)}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="paginationBar">
        <span>
          Page {safePageIndex + 1} of {totalPages}
        </span>
        <label>
          Rows
          <select
            value={activePagination.pageSize}
            onChange={(event) =>
              setPagination({
                pageIndex: 0,
                pageSize: Number(event.target.value)
              })
            }
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="pagerButtons">
          <button
            type="button"
            onClick={() => setPagination({ ...activePagination, pageIndex: 0 })}
            disabled={safePageIndex === 0}
          >
            First
          </button>
          <button
            type="button"
            onClick={() =>
              setPagination({
                ...activePagination,
                pageIndex: safePageIndex - 1
              })
            }
            disabled={safePageIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              setPagination({
                ...activePagination,
                pageIndex: safePageIndex + 1
              })
            }
            disabled={safePageIndex >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function ChildRows<T, C>({
  childRows,
  parent,
  parentId,
  state,
  onRetry
}: {
  childRows?: ChildRowsConfig<T, C>;
  parent: T;
  parentId: string;
  state?: ChildLoadState<C>;
  onRetry: () => void;
}) {
  if (!childRows) {
    return null;
  }

  const inlineChildren = childRows.getChildren?.(parent);
  const children = inlineChildren?.length ? inlineChildren : state?.data;

  if (state?.loading) {
    return (
      <div className="childLoading" role="status">
        <span className="miniSpinner" />
        Loading details...
      </div>
    );
  }

  if (state?.error) {
    return (
      <div className="childError">
        <span>{state.error}</span>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!children?.length) {
    return (
      <div className="childEmpty">
        {childRows.emptyMessage ?? "No child records for this row."}
      </div>
    );
  }

  const childMinWidth = childRows.columns.reduce(
    (total, column) => total + getColumnMinWidth(column),
    0
  );

  return (
    <div className="childGridWrapper">
      <div
        className="childGrid"
        style={{
          gridTemplateColumns: childRows.columns
            .map((column) =>
              typeof column.width === "number"
                ? `minmax(${column.width}px, 1fr)`
                : column.width ?? `minmax(${column.minWidth ?? 120}px, 1fr)`
            )
            .join(" "),
          minWidth: childMinWidth
        }}
      >
        {childRows.columns.map((column) => (
          <div className="childHeader" key={column.id}>
            {column.header}
          </div>
        ))}
        {children.map((child, index) => {
          const childId =
            childRows.getChildId?.(child, index, parent) ??
            `${parentId}-${index}`;
          return childRows.columns.map((column) => (
            <div className="childCell" key={`${childId}-${column.id}`}>
              {renderCell(child, column)}
            </div>
          ));
        })}
      </div>
    </div>
  );
}

function renderCell<T>(row: T, column: ColumnDef<T>) {
  if (column.cell) {
    return column.cell(row);
  }

  if (typeof column.accessor === "function") {
    return column.accessor(row);
  }

  if (column.accessor) {
    const value = row[column.accessor];
    return value == null ? "" : String(value);
  }

  return "";
}

function getSortValue<T>(row: T, column: ColumnDef<T>): PrimitiveSortValue {
  if (column.sortAccessor) {
    return column.sortAccessor(row);
  }

  if (typeof column.accessor === "function") {
    const value = column.accessor(row);
    return typeof value === "string" || typeof value === "number" ? value : "";
  }

  if (column.accessor) {
    return normalizeSortValue(row[column.accessor]);
  }

  return "";
}

function normalizeSortValue(value: unknown): PrimitiveSortValue {
  if (
    value instanceof Date ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value == null
  ) {
    return value;
  }

  return String(value);
}

function compareSortValues(a: PrimitiveSortValue, b: PrimitiveSortValue) {
  const normalizedA = a instanceof Date ? a.getTime() : a;
  const normalizedB = b instanceof Date ? b.getTime() : b;

  if (normalizedA == null && normalizedB == null) {
    return 0;
  }
  if (normalizedA == null) {
    return 1;
  }
  if (normalizedB == null) {
    return -1;
  }

  if (typeof normalizedA === "number" && typeof normalizedB === "number") {
    return normalizedA - normalizedB;
  }

  return String(normalizedA).localeCompare(String(normalizedB), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function columnClassName<T>(column: ColumnDef<T>) {
  return [
    column.pinned === "left" ? "pinnedColumn" : "",
    column.align ? `align-${column.align}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function columnStyle<T>(column: ColumnDef<T>) {
  return {
    minWidth: column.minWidth,
    textAlign: column.align
  };
}

function getColumnTrack<T>(column: ColumnDef<T>) {
  if (typeof column.width === "number") {
    return `minmax(${column.width}px, 1fr)`;
  }

  return column.width ?? `minmax(${column.minWidth ?? 140}px, 1fr)`;
}

function getColumnMinWidth<T>(column: ColumnDef<T>) {
  if (typeof column.width === "number") {
    return column.width;
  }

  if (column.minWidth) {
    return column.minWidth;
  }

  const width = column.width?.match(/^(\d+)px$/);
  return width ? Number(width[1]) : 140;
}
