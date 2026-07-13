"use client";

import { useMemo, useState } from "react";

export function SeatLayoutBuilder() {
  const [rows, setRows] = useState(3),
    [columns, setColumns] = useState(8),
    [disabled, setDisabled] = useState<string[]>([]);
  const seats = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => ({
          label: `${String.fromCharCode(65 + row)}${column + 1}`,
          row: row + 1,
          column: column + 1,
        })),
      ).flat(),
    [rows, columns],
  );
  const active = seats.filter((seat) => !disabled.includes(seat.label));
  return (
    <section className="rounded-2xl border border-[#d3bbff] bg-[#f7f5ff] p-5 sm:col-span-2 sm:p-7">
      <p className="ha-kicker">Seat layout</p>
      <h3 className="ha-title mt-1 text-xl">좌석 배치도 만들기</h3>
      <p className="mt-2 text-sm text-[#60687a]">
        행과 열을 정한 뒤 빈 공간이나 통로로 사용할 좌석을 눌러 해제하세요.
      </p>
      <div className="mt-4 flex gap-4">
        <label className="text-sm">
          행 수
          <input
            className="ha-input ml-2 w-20 py-1"
            max="20"
            min="1"
            onChange={(e) => {
              setRows(Number(e.target.value));
              setDisabled([]);
            }}
            type="number"
            value={rows}
          />
        </label>
        <label className="text-sm">
          열 수
          <input
            className="ha-input ml-2 w-20 py-1"
            max="20"
            min="1"
            onChange={(e) => {
              setColumns(Number(e.target.value));
              setDisabled([]);
            }}
            type="number"
            value={columns}
          />
        </label>
      </div>
      <div className="mx-auto mt-5 max-w-4xl overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-6">
        <div className="mb-7 border-t-4 border-[#d3bbff] pt-2 text-center text-xs font-black tracking-[0.35em] text-[#7b7485]">
          STAGE
        </div>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 1fr))`,
          }}
        >
          {seats.map((seat) => {
            const enabled = !disabled.includes(seat.label);
            return (
              <button
                aria-pressed={enabled}
                className={`rounded-lg border px-1 py-2 text-xs font-semibold ${enabled ? "border-[#712ae2] bg-[#ebddff] text-[#420093]" : "border-dashed border-[#ccc3d6] bg-[#eff3ff] text-[#7b7485]"}`}
                key={seat.label}
                onClick={() =>
                  setDisabled((current) =>
                    enabled
                      ? [...current, seat.label]
                      : current.filter((label) => label !== seat.label),
                  )
                }
                type="button"
              >
                {enabled ? seat.label : "통로"}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-sm font-bold text-[#420093]">
        사용 좌석 {active.length}석
      </p>
      <input
        name="seats"
        type="hidden"
        value={active.map((seat) => seat.label).join(",")}
      />
      <input name="seatLayout" type="hidden" value={JSON.stringify(active)} />
    </section>
  );
}
