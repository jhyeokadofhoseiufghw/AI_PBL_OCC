import { toggleSeat, updateSeat } from "../actions";

type Seat = {
  id: string;
  label: string;
  isActive: boolean;
  occupied: boolean;
  layoutRow: number | null;
  layoutColumn: number | null;
};
export function SeatGridManager({
  eventId,
  seats,
  editable = true,
}: {
  eventId: string;
  seats: Seat[];
  editable?: boolean;
}) {
  const positioned = seats.filter(
    (seat) => seat.layoutColumn && seat.layoutRow,
  );
  const size = Math.max(
    4,
    ...positioned.map((seat) => seat.layoutColumn ?? 0),
    Math.ceil(Math.sqrt(seats.length)),
  );
  const layout = seats.map((seat, index) => ({
    ...seat,
    row: seat.layoutRow ?? Math.floor(index / size) + 1,
    column: seat.layoutColumn ?? (index % size) + 1,
  }));
  return (
    <section className="mt-6 overflow-x-auto rounded-xl border bg-white p-5">
      <div className="mx-auto min-w-[36rem] max-w-5xl">
        <div className="mb-6 rounded-lg bg-zinc-800 py-3 text-center text-sm font-medium text-white">
          STAGE
        </div>
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(4.5rem, 1fr))`,
          }}
        >
          {layout.map((seat) => (
            <article
              className={`rounded-lg border p-2 ${seat.isActive ? "border-emerald-300 bg-emerald-50" : "border-dashed bg-zinc-100"} ${seat.occupied ? "ring-2 ring-amber-300" : ""}`}
              key={seat.id}
              style={{ gridColumn: seat.column, gridRow: seat.row }}
            >
              {editable ? (
                <>
                  <form action={updateSeat}>
                    <input name="eventId" type="hidden" value={eventId} />
                    <input name="seatId" type="hidden" value={seat.id} />
                    <input name="layoutRow" type="hidden" value={seat.row} />
                    <input
                      name="layoutColumn"
                      type="hidden"
                      value={seat.column}
                    />
                    <input
                      aria-label={`${seat.label} 좌석명`}
                      className="w-full rounded border bg-white px-2 py-1 text-center text-sm font-medium"
                      name="label"
                      defaultValue={seat.label}
                    />
                    <button className="mt-2 w-full rounded border bg-white px-2 py-1 text-xs">
                      이름 수정
                    </button>
                  </form>
                  <form action={toggleSeat} className="mt-1">
                    <input name="eventId" type="hidden" value={eventId} />
                    <input name="seatId" type="hidden" value={seat.id} />
                    <input
                      name="activate"
                      type="hidden"
                      value={seat.isActive ? "0" : "1"}
                    />
                    <button
                      className={`w-full rounded px-2 py-1 text-xs ${seat.isActive ? "text-red-700" : "bg-emerald-700 text-white"}`}
                    >
                      {seat.isActive ? "비활성화" : "활성화"}
                    </button>
                  </form>
                </>
              ) : (
                <p className="py-3 text-center text-sm font-medium">
                  {seat.label}
                </p>
              )}
              {seat.occupied ? (
                <p className="mt-1 text-center text-[11px] text-amber-700">
                  예매 점유
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
