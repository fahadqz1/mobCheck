// Pakistan has no daylight saving, so a fixed +05:00 offset is exact.
const PKT_OFFSET = '+05:00';
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DAY_FLAG = ['availableSunday', 'availableMonday', 'availableTuesday', 'availableWednesday', 'availableThursday', 'availableFriday', 'availableSaturday'] as const;

type ShopHours = { openingHour: string | null; closingHour: string | null; weeklyHolidays: string[] };
type InspectorDays = Record<(typeof DAY_FLAG)[number], boolean> & { status: string };

export function slotToDate(date: string, time: string) {
  return new Date(`${date}T${time}:00${PKT_OFFSET}`);
}

export function validateSlot(date: string, time: string, shop: ShopHours, inspectors: InspectorDays[], now = new Date()) {
  const when = slotToDate(date, time);
  if (Number.isNaN(when.getTime())) return { error: 'Choose a valid date and time' };
  if (when.getTime() < now.getTime() + 60 * 60 * 1000) return { error: 'Choose a time at least one hour from now', field: 'time' };
  if (when.getTime() > now.getTime() + 30 * 86400000) return { error: 'Bookings can be made up to 30 days ahead', field: 'date' };
  const dayIndex = new Date(`${date}T12:00:00${PKT_OFFSET}`).getUTCDay();
  if (shop.weeklyHolidays.includes(DAY_NAMES[dayIndex])) return { error: `The shop is closed on ${DAY_NAMES[dayIndex]}s`, field: 'date' };
  if (shop.openingHour && shop.closingHour && (time < shop.openingHour || time >= shop.closingHour)) {
    return { error: `Choose a time between ${shop.openingHour} and ${shop.closingHour}`, field: 'time' };
  }
  if (!inspectors.some((i) => i.status === 'ACTIVE' && i[DAY_FLAG[dayIndex]])) return { error: `No inspector works on ${DAY_NAMES[dayIndex]}s at this shop`, field: 'date' };
  return { when };
}
