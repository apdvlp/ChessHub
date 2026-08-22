export function toISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function monthName(month) {
    return new Date(2000, month).toLocaleString("default", {
        month: "long",
    });
}

export function buildCalendar(year, month) {

    const firstDay = new Date(year, month, 1);

    const startDay = firstDay.getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const cells = [];

    for (let i = 0; i < startDay; i++) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, month, day, 12, 0, 0));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}