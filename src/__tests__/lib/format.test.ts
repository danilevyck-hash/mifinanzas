import { describe, it, expect } from "vitest";
import { formatCurrency, formatDateExport } from "@/lib/format";

describe("formatCurrency", () => {
  it("formats whole numbers with two decimals and dollar sign", () => {
    // Without window/localStorage, defaults to "$"
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1500.5)).toBe("$1,500.50");
  });

  it("formats negative numbers", () => {
    expect(formatCurrency(-50)).toBe("$-50.00");
  });
});

describe("formatDateExport", () => {
  it("formats date with Spanish month abbreviation", () => {
    expect(formatDateExport("2026-01-15")).toBe("15-ene-2026");
  });

  it("handles December", () => {
    expect(formatDateExport("2026-12-25")).toBe("25-dic-2026");
  });

  it("returns dash for empty string", () => {
    expect(formatDateExport("")).toBe("-");
  });
});
