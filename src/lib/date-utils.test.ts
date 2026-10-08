import { describe, it, expect } from "vitest";
import {
  addCabinetDays,
  cabinetDayOfMonth,
  cabinetTime,
  dateFromInputs,
  formatCabinetDate,
  formatCabinetTime,
  isSameCabinetDay,
  mondayOfCabinetWeek,
  startOfCabinetDay,
} from "@/lib/date-utils";

describe("heure du cabinet (Europe/Paris)", () => {
  it("converts wall-clock cabinet time to the real UTC instant, summer and winter", () => {
    expect(cabinetTime(2026, 7, 15, 9, 0).toISOString()).toBe("2026-07-15T07:00:00.000Z"); // UTC+2
    expect(cabinetTime(2026, 12, 10, 9, 0).toISOString()).toBe("2026-12-10T08:00:00.000Z"); // UTC+1
    expect(dateFromInputs("2026-10-15", "09:30").toISOString()).toBe("2026-10-15T07:30:00.000Z");
  });

  it("formats in cabinet time whatever the machine's timezone", () => {
    const instant = new Date("2026-12-10T08:00:00.000Z");
    expect(formatCabinetTime(instant)).toBe("09:00");
    expect(formatCabinetDate(instant, { weekday: "long", day: "numeric", month: "long" })).toBe(
      "jeudi 10 décembre"
    );
  });

  it("handles days around the DST changes (23 h and 25 h days)", () => {
    // Passage à l'heure d'été : dimanche 29 mars 2026.
    const springDay = startOfCabinetDay(new Date("2026-03-29T12:00:00Z"));
    expect(springDay.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(addCabinetDays(springDay, 1).toISOString()).toBe("2026-03-29T22:00:00.000Z");
    // Passage à l'heure d'hiver : dimanche 25 octobre 2026.
    const autumnDay = startOfCabinetDay(new Date("2026-10-25T12:00:00Z"));
    expect(autumnDay.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(addCabinetDays(autumnDay, 1).toISOString()).toBe("2026-10-25T23:00:00.000Z");
    expect(formatCabinetTime(cabinetTime(2026, 10, 25, 9, 0))).toBe("09:00");
  });

  it("uses the cabinet day, not the UTC day, near midnight", () => {
    // 23:30 UTC le 14 = 01:30 le 15 à Paris (été).
    const lateUtc = new Date("2026-07-14T23:30:00Z");
    expect(cabinetDayOfMonth(lateUtc)).toBe(15);
    expect(isSameCabinetDay(lateUtc, cabinetTime(2026, 7, 15, 10, 0))).toBe(true);
    expect(isSameCabinetDay(lateUtc, cabinetTime(2026, 7, 14, 10, 0))).toBe(false);
  });

  it("finds the Monday of the cabinet week, across month and DST boundaries", () => {
    expect(mondayOfCabinetWeek(cabinetTime(2026, 10, 25, 15, 0)).toISOString()).toBe(
      "2026-10-18T22:00:00.000Z" // lundi 19 octobre 00:00 Paris (été)
    );
    expect(mondayOfCabinetWeek(cabinetTime(2026, 11, 1, 10, 0)).toISOString()).toBe(
      "2026-10-25T23:00:00.000Z" // lundi 26 octobre 00:00 Paris (hiver)
    );
  });
});
