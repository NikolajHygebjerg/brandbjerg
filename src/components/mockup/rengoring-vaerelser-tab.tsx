"use client";

import { useMemo } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatDateDaShort,
  parseIsoDate,
} from "@/lib/date-utils";
import {
  getAllRoomsByBuildingColumn,
  ROOM_BUILDING_COLUMNS,
} from "@/lib/room-utils";
import type { RengoringVaerelseRow } from "@/lib/rengoring-room-utils";

type VaerelseFilter = "all" | "klar" | "needs_cleaning";

const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

function CompactMonthCalendar({
  selectedDate,
  today,
  monthLabel,
  monthGrid,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  selectedDate: string;
  today: string;
  monthLabel: string;
  monthGrid: (string | null)[][];
  onSelectDate: (d: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
          aria-label="Forrige måned"
        >
          ←
        </button>
        <span className="text-center text-[11px] font-semibold capitalize text-slate-800">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
          aria-label="Næste måned"
        >
          →
        </button>
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] font-medium text-slate-400">
        {WEEKDAY_LABELS.map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {monthGrid.flat().map((date, idx) => {
          if (!date) {
            return <div key={`e-${idx}`} className="h-6" />;
          }
          const isSelected = date === selectedDate;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "h-6 rounded text-[10px] font-medium transition",
                isSelected
                  ? "bg-emerald-600 text-white"
                  : isToday
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {parseIsoDate(date).getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-emerald-700 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}

function StatusCheckbox({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1",
        disabled && "cursor-default opacity-80",
      )}
    >
      <input
        type="checkbox"
        className="size-3.5 rounded border-slate-300 text-emerald-600 disabled:cursor-default"
        checked={checked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        readOnly={!onChange}
      />
      <span className="text-[10px] font-medium text-slate-600">{label}</span>
    </label>
  );
}

function RoomCell({
  row,
  onToggleKlar,
}: {
  row: RengoringVaerelseRow;
  onToggleKlar: (room: string, klar: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "rounded border border-slate-200/80 bg-white px-1.5 py-1.5 text-center",
        row.inUse && "ring-1 ring-amber-300",
        row.needsCleaning && !row.klar && "border-amber-300 bg-amber-50/50",
      )}
    >
      <p className="text-sm font-bold tabular-nums text-slate-900">
        {row.roomNumber}
      </p>
      <div className="mt-1 space-y-0.5">
        <StatusCheckbox checked={row.inUse} disabled label="I brug" />
        <StatusCheckbox
          checked={row.klar}
          label="Klar"
          onChange={(checked) => onToggleKlar(row.roomNumber, checked)}
        />
      </div>
    </div>
  );
}

export function RengoringVaerelserTab({
  selectedDate,
  today,
  monthLabel,
  monthGrid,
  vaerelser,
  vaerelseFilter,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onFilterChange,
  onToggleKlar,
}: {
  selectedDate: string;
  today: string;
  monthLabel: string;
  monthGrid: (string | null)[][];
  vaerelser: RengoringVaerelseRow[];
  vaerelseFilter: VaerelseFilter;
  onSelectDate: (d: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onFilterChange: (f: VaerelseFilter) => void;
  onToggleKlar: (room: string, klar: boolean) => void;
}) {
  const rowByRoom = useMemo(() => {
    const map = new Map<string, RengoringVaerelseRow>();
    for (const row of vaerelser) {
      map.set(row.roomNumber, row);
    }
    return map;
  }, [vaerelser]);
  const allByColumn = getAllRoomsByBuildingColumn();

  const visibleCount = vaerelser.filter((r) =>
    matchesFilter(r, vaerelseFilter),
  ).length;

  return (
    <Card>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">
                Værelser · {formatDateDaShort(selectedDate)}
              </CardTitle>
              <CardDescription>
                6 kolonner efter fløj og etage — {visibleCount} vist
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={vaerelseFilter === "klar"}
                onClick={() =>
                  onFilterChange(vaerelseFilter === "klar" ? "all" : "klar")
                }
              >
                Kun klar
              </FilterButton>
              <FilterButton
                active={vaerelseFilter === "needs_cleaning"}
                onClick={() =>
                  onFilterChange(
                    vaerelseFilter === "needs_cleaning"
                      ? "all"
                      : "needs_cleaning",
                  )
                }
              >
                Skal gøres rent
              </FilterButton>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {ROOM_BUILDING_COLUMNS.map((col) => (
              <BuildingColumn
                key={col.id}
                column={col}
                roomNumbers={allByColumn[col.id]}
                rowByRoom={rowByRoom}
                filter={vaerelseFilter}
                onToggleKlar={onToggleKlar}
              />
            ))}
          </div>
        </div>

        <div className="w-full shrink-0 xl:w-[168px]">
          <CompactMonthCalendar
            selectedDate={selectedDate}
            today={today}
            monthLabel={monthLabel}
            monthGrid={monthGrid}
            onSelectDate={onSelectDate}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
          />
        </div>
      </div>
    </Card>
  );
}

function BuildingColumn({
  column,
  roomNumbers,
  rowByRoom,
  filter,
  onToggleKlar,
}: {
  column: (typeof ROOM_BUILDING_COLUMNS)[number];
  roomNumbers: string[];
  rowByRoom: Map<string, RengoringVaerelseRow>;
  filter: VaerelseFilter;
  onToggleKlar: (room: string, klar: boolean) => void;
}) {
  const visibleRooms = roomNumbers.filter((room) => {
    const row = rowByRoom.get(room);
    if (!row) return filter === "all";
    return matchesFilter(row, filter);
  });

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-lg border",
        column.columnClass,
      )}
    >
      <div
        className={cn(
          "rounded-t-lg px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide",
          column.headerClass,
        )}
      >
        {column.label}
      </div>
      <div className="flex flex-col gap-1 p-1">
        {visibleRooms.length === 0 ? (
          <p className="px-1 py-4 text-center text-[10px] text-slate-400">
            —
          </p>
        ) : (
          visibleRooms.map((room) => {
            const row = rowByRoom.get(room);
            if (!row) return null;
            return (
              <RoomCell
                key={room}
                row={row}
                onToggleKlar={onToggleKlar}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function matchesFilter(row: RengoringVaerelseRow, filter: VaerelseFilter): boolean {
  if (filter === "klar") return row.klar;
  if (filter === "needs_cleaning") return row.needsCleaning;
  return true;
}
