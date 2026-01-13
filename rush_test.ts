import * as assert from "assert";
import { describe, expect, it } from "bun:test";

import { calculateCanProcess, processGroup } from "./rush";

describe("calculating process can be done based on average speed", () => {
  it("should return max process when average duration is zero", () => {
    const result = calculateCanProcess(5, 3000, 0);
    expect(result).toBe(5);
  });

  it("should return calculated process based on average duration", () => {
    const result = calculateCanProcess(5, 3000, 1000);
    expect(result).toBe(3);
  });

  it("should not exceed max process", () => {
    const result = calculateCanProcess(4, 3000, 500);
    expect(result).toBe(4);
  });
});

describe("processing group of async functions", () => {
  it("should process all functions and return results", async () => {
    const asyncFunctions = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
      () => Promise.resolve(3),
    ];

    await processGroup(asyncFunctions, (i, result) => {
      expect(result.status).toBe("fulfilled");
      assert.ok(result.status === "fulfilled");
      expect(result.value).toBe(i + 1);
    });
  });

  it("should handle rejected promises", async () => {
    const asyncFunctions = [
      () => Promise.resolve(1),
      () => Promise.reject(new Error("Test error")),
      () => Promise.resolve(3),
    ];

    await processGroup(asyncFunctions, (i, result) => {
      if (i === 1) {
        expect(result.status).toBe("rejected");
        assert.ok(result.status === "rejected");
        expect(result.reason.message).toBe("Test error");
      } else {
        expect(result.status).toBe("fulfilled");
        assert.ok(result.status === "fulfilled");
        expect(result.value).toBe(i + 1);
      }
    });
  });
});
