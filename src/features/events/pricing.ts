export function calculateReservationTotal(
  ticketPrice: number,
  quantity: number,
) {
  if (!Number.isInteger(ticketPrice) || ticketPrice < 0) {
    throw new RangeError("ticketPrice must be a non-negative integer");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError("quantity must be a positive integer");
  }

  return ticketPrice * quantity;
}

export function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
