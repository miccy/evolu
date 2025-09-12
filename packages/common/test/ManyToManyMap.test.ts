import { expect, test } from "vitest";
import { createManyToManyMap } from "../src/ManyToManyMap.js";

test("ManyToManyMap - add and getValues/getKeys", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);

  expect(map.getValues("a")?.has(1)).toBe(true);
  expect(map.getValues("a")?.has(2)).toBe(true);
  expect(map.getValues("a")?.has(3)).toBe(false);
  expect(map.getValues("b")?.has(2)).toBe(true);
  expect(map.getValues("c")).toBeUndefined();

  expect(map.getKeys(1)?.has("a")).toBe(true);
  expect(map.getKeys(1)?.has("b")).toBe(false);
  expect(map.getKeys(2)?.has("a")).toBe(true);
  expect(map.getKeys(2)?.has("b")).toBe(true);
  expect(map.getKeys(3)).toBeUndefined();
});

test("ManyToManyMap - hasPair", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("b", 2);

  expect(map.hasPair("a", 1)).toBe(true);
  expect(map.hasPair("b", 2)).toBe(true);
  expect(map.hasPair("a", 2)).toBe(false);
  expect(map.hasPair("b", 1)).toBe(false);
  expect(map.hasPair("c", 1)).toBe(false);
});

test("ManyToManyMap - hasKey and hasValue", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);

  expect(map.hasKey("a")).toBe(true);
  expect(map.hasKey("b")).toBe(true);
  expect(map.hasKey("c")).toBe(false);

  expect(map.hasValue(1)).toBe(true);
  expect(map.hasValue(2)).toBe(true);
  expect(map.hasValue(3)).toBe(false);
});

test("ManyToManyMap - remove", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);

  expect(map.remove("a", 1)).toBe(true);
  expect(map.hasPair("a", 1)).toBe(false);
  expect(map.hasPair("a", 2)).toBe(true);
  expect(map.hasPair("b", 2)).toBe(true);

  // Remove non-existent pair should return false
  expect(map.remove("a", 3)).toBe(false);
  expect(map.remove("c", 1)).toBe(false);

  // Remove last value for a key should remove the key
  expect(map.remove("a", 2)).toBe(true);
  expect(map.hasKey("a")).toBe(false);

  // Remove last key for a value should remove the value
  expect(map.remove("b", 2)).toBe(true);
  expect(map.hasValue(2)).toBe(false);
});

test("ManyToManyMap - deleteKey", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);
  map.add("c", 3);

  expect(map.deleteKey("a")).toBe(true);
  expect(map.hasKey("a")).toBe(false);
  expect(map.hasValue(1)).toBe(false);
  expect(map.hasValue(2)).toBe(true);
  expect(map.hasKey("b")).toBe(true);

  expect(map.deleteKey("nonexistent")).toBe(false);
});

test("ManyToManyMap - deleteValue", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);
  map.add("c", 3);

  expect(map.deleteValue(2)).toBe(true);
  expect(map.hasValue(2)).toBe(false);
  expect(map.hasKey("a")).toBe(true);
  expect(map.hasKey("b")).toBe(false);

  expect(map.deleteValue(99)).toBe(false);
});

test("ManyToManyMap - clear", () => {
  const map = createManyToManyMap<string, number>();

  map.add("a", 1);
  map.add("b", 2);

  map.clear();

  expect(map.hasKey("a")).toBe(false);
  expect(map.hasKey("b")).toBe(false);
  expect(map.hasValue(1)).toBe(false);
  expect(map.hasValue(2)).toBe(false);
});

test("ManyToManyMap - with complex objects as keys and values", () => {
  interface Person {
    name: string;
    age: number;
  }
  interface City {
    name: string;
    country: string;
  }

  const map = createManyToManyMap<Person, City>();

  const alice = { name: "Alice", age: 30 };
  const bob = { name: "Bob", age: 25 };
  const newyork = { name: "New York", country: "USA" };
  const london = { name: "London", country: "UK" };

  map.add(alice, newyork);
  map.add(alice, london);
  map.add(bob, london);

  expect(map.hasPair(alice, newyork)).toBe(true);
  expect(map.hasPair(alice, london)).toBe(true);
  expect(map.hasPair(bob, london)).toBe(true);
  expect(map.hasPair(bob, newyork)).toBe(false);

  expect(map.getValues(alice)?.has(newyork)).toBe(true);
  expect(map.getValues(alice)?.has(london)).toBe(true);
  expect(map.getKeys(london)?.has(alice)).toBe(true);
  expect(map.getKeys(london)?.has(bob)).toBe(true);

  expect(map.remove(alice, newyork)).toBe(true);
  expect(map.hasPair(alice, newyork)).toBe(false);

  expect(map.deleteKey(alice)).toBe(true);
  expect(map.hasKey(alice)).toBe(false);
  expect(map.hasPair(alice, london)).toBe(false);
});

test("ManyToManyMap - duplicate adds and return value", () => {
  const map = createManyToManyMap<string, number>();
  expect(map.add("a", 1)).toBe(true); // new
  expect(map.add("a", 1)).toBe(false); // duplicate
  expect(map.add("a", 2)).toBe(true); // new value for existing key
  expect(map.add("b", 2)).toBe(true); // new key referencing existing value
  expect(map.getValues("a")?.size).toBe(2);
  expect(map.getKeys(1)?.size).toBe(1);
  expect(map.getKeys(2)?.size).toBe(2);
});

test("ManyToManyMap - forEach iterates over pairs", () => {
  const map = createManyToManyMap<string, number>();
  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);
  const pairs: Array<[string, number]> = [];
  map.forEach((k, v) => pairs.push([k, v]));
  expect(pairs).toEqual([
    ["a", 1],
    ["a", 2],
    ["b", 2],
  ]);
});

test("ManyToManyMap - iterator yields pairs", () => {
  const map = createManyToManyMap<string, number>();
  map.add("a", 1);
  map.add("a", 2);
  map.add("b", 2);
  const pairs = [...map];
  expect(pairs).toEqual([
    ["a", 1],
    ["a", 2],
    ["b", 2],
  ]);
});

test("ManyToManyMap - counts", () => {
  const map = createManyToManyMap<string, number>();
  expect(map.keyCount()).toBe(0);
  expect(map.valueCount()).toBe(0);
  expect(map.pairCount()).toBe(0);
  map.add("a", 1); // new pair
  expect(map.keyCount()).toBe(1);
  expect(map.valueCount()).toBe(1);
  expect(map.pairCount()).toBe(1);
  map.add("a", 2); // new value same key
  expect(map.keyCount()).toBe(1);
  expect(map.valueCount()).toBe(2);
  expect(map.pairCount()).toBe(2);
  map.add("b", 2); // new key same value
  expect(map.keyCount()).toBe(2);
  expect(map.valueCount()).toBe(2);
  expect(map.pairCount()).toBe(3);
  map.add("b", 2); // duplicate
  expect(map.pairCount()).toBe(3);
  map.remove("a", 1);
  expect(map.pairCount()).toBe(2);
  map.deleteKey("b"); // removes (b,2)
  expect(map.pairCount()).toBe(1);
  map.deleteValue(2); // removes (a,2)
  expect(map.pairCount()).toBe(0);
  expect(map.keyCount()).toBe(0);
  expect(map.valueCount()).toBe(0);
});
