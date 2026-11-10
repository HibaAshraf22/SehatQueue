
function getPakistanDateString(value) {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  const day = parts.find((part) => part.type === "day").value;

  return `${year}-${month}-${day}`;
}

function getPakistanWeekday(value) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "long"
  }).format(new Date(value));
}

function getPakistanDayRange(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const startOfDay = new Date(
    `${dateString}T00:00:00.000+05:00`
  );

  if (
    isNaN(startOfDay.getTime()) ||
    getPakistanDateString(startOfDay) !== dateString
  ) {
    throw new Error("Invalid Pakistan date");
  }

  const endOfDay = new Date(
    startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1
  );

  return { startOfDay, endOfDay };
}

module.exports = {
  getPakistanDateString,
  getPakistanWeekday,
  getPakistanDayRange
};
