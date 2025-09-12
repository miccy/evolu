import { CreateWebSocket, TimingSafeEqual, WebSocket } from "@evolu/common";
import BetterSQLite, { Statement } from "better-sqlite3";
import { timingSafeEqual } from "crypto";
import { customRandom, urlAlphabet } from "nanoid";
import { Console } from "../src/Console.js";
import {
  createSymmetricCrypto,
  RandomBytes,
  RandomBytesDep,
  SymmetricCryptoDep,
} from "../src/Crypto.js";
import {
  createOwner,
  createOwnerSecret,
  ownerIdToBinaryOwnerId,
} from "../src/Evolu/Owner.js";
import { constFalse, constVoid } from "../src/Function.js";
import { NanoIdLib, NanoIdLibDep } from "../src/NanoId.js";
import {
  createRandomLibWithSeed,
  createRandomWithSeed,
} from "../src/Random.js";
import { getOrThrow, ok } from "../src/Result.js";
import {
  createPreparedStatementsCache,
  createSqlite,
  CreateSqliteDriver,
  Sqlite,
  SqliteDriver,
  SqliteRow,
} from "../src/Sqlite.js";
import { createTestTime, TimeDep } from "../src/Time.js";
import { createId, Id, SimpleName } from "../src/Type.js";
// import { existsSync, unlinkSync } from "fs";

export const testRandom = createRandomWithSeed("evolu");
export const testTime = createTestTime();

export const testRandomLib = createRandomLibWithSeed("evolu").random;
export const testRandomLib2 = createRandomLibWithSeed("forever").random;

// Test nanoids are unique only for a few thousands of iterations.
// https://github.com/transitive-bullshit/random/issues/45
export const testNanoIdLib: NanoIdLib = {
  urlAlphabet,
  nanoid: customRandom(urlAlphabet, 21, (size) =>
    new Uint8Array(size).map(() => testRandomLib.int(0, 255)),
  ),
  customAlphabet: (alphabet, defaultSize = 21) =>
    customRandom(alphabet, defaultSize, (size) =>
      new Uint8Array(size).map(() => testRandomLib.int(0, 255)),
    ),
};

export const testNanoIdLib2: NanoIdLib = {
  urlAlphabet,
  nanoid: customRandom(urlAlphabet, 21, (size) =>
    new Uint8Array(size).map(() => testRandomLib2.int(0, 255)),
  ),
  customAlphabet: (alphabet, defaultSize = 21) =>
    customRandom(alphabet, defaultSize, (size) =>
      new Uint8Array(size).map(() => testRandomLib2.int(0, 255)),
    ),
};

export const testNanoIdLibDep = { nanoIdLib: testNanoIdLib };

export const testCreateId = (): Id => createId(testNanoIdLibDep);

export const testRandomBytes: RandomBytes = {
  create: (bytesLength) => {
    const array = Array.from({ length: bytesLength }, () =>
      testRandomLib.int(0, 255),
    );
    return new Uint8Array(array);
  },
} as RandomBytes;

const randomBytesDep = { randomBytes: testRandomBytes };

export const testOwnerSecret = createOwnerSecret(randomBytesDep);
export const testOwnerSecret2 = createOwnerSecret(randomBytesDep);

export const testSymmetricCrypto = createSymmetricCrypto(randomBytesDep);

type TestDeps = NanoIdLibDep & RandomBytesDep & SymmetricCryptoDep & TimeDep;

export const testDeps: TestDeps = {
  nanoIdLib: testNanoIdLib,
  randomBytes: testRandomBytes,
  symmetricCrypto: testSymmetricCrypto,
  time: testTime,
};

export const testOwner = createOwner(testOwnerSecret);
export const testOwnerBinaryId = ownerIdToBinaryOwnerId(testOwner.id);

export const testOwner2 = createOwner(testOwnerSecret2);
export const testOwnerBinaryId2 = ownerIdToBinaryOwnerId(testOwner2.id);

//   /**
//    * Log for SQL.
//    *
//    * - `select log(a) from foo`
//    */
//   db.function("log", (msg) => {
//     // eslint-disable-next-line no-console
//     console.log(msg);
//   });
export const testCreateSqliteDriver: CreateSqliteDriver = () => {
  // TODO: Param for benchmark tests and delete that file after.
  // const dbFile = "test.db";
  // if (existsSync(dbFile)) unlinkSync(dbFile);
  // const db = new BetterSQLite(dbFile);
  const db = new BetterSQLite(":memory:");
  let isDisposed = false;

  const cache = createPreparedStatementsCache<Statement>(
    (sql) => db.prepare(sql),
    // Not needed.
    // https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-statement
    constVoid,
  );

  const driver: SqliteDriver = {
    exec: (query, isMutation) => {
      // Always prepare is recommended for better-sqlite3
      const prepared = cache.get(query, true);

      const rows = isMutation
        ? []
        : (prepared.all(query.parameters) as Array<SqliteRow>);

      const changes = isMutation ? prepared.run(query.parameters).changes : 0;

      return { rows, changes };
    },

    export: () => db.serialize(),

    [Symbol.dispose]: () => {
      if (isDisposed) return;
      isDisposed = true;
      cache[Symbol.dispose]();
      db.close();
    },
  };

  return Promise.resolve(driver);
};

export const testSimpleName = SimpleName.fromOrThrow("Test");

export const testCreateSqlite = async (): Promise<Sqlite> => {
  const sqlite = await createSqlite({
    createSqliteDriver: testCreateSqliteDriver,
  })(testSimpleName);
  return getOrThrow(sqlite);
};

export const testCreateTimingSafeEqual = (): TimingSafeEqual => timingSafeEqual;

export interface TestWebSocket extends WebSocket {
  readonly sentMessages: ReadonlyArray<Uint8Array>;
  readonly simulateMessage: (message: Uint8Array) => void;
  readonly simulateOpen: () => void;
  readonly simulateClose: () => void;
}

export const createTestWebSocket = (
  _url?: string,
  options?: {
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (error: any) => void;
    onMessage?: (data: string | ArrayBuffer | Blob) => void;
  },
): TestWebSocket => {
  const sentMessages: Array<Uint8Array> = [];
  let isWebSocketOpen = false;

  return {
    get sentMessages() {
      return sentMessages;
    },
    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      sentMessages.push(data as Uint8Array);
      return ok();
    },
    getReadyState: () => (isWebSocketOpen ? "open" : "connecting"),
    isOpen: () => isWebSocketOpen,
    simulateMessage: (message: Uint8Array) => {
      if (options?.onMessage) {
        options.onMessage(message.buffer as ArrayBuffer);
      }
    },
    simulateOpen: () => {
      isWebSocketOpen = true;
      if (options?.onOpen) {
        options.onOpen();
      }
    },
    simulateClose: () => {
      isWebSocketOpen = false;
      if (options?.onClose) {
        options.onClose({} as CloseEvent);
      }
    },
    [Symbol.dispose]: constVoid,
  };
};

export const testCreateDummyWebSocket: CreateWebSocket = () => ({
  send: () => ok(),
  getReadyState: () => "connecting",
  isOpen: constFalse,
  [Symbol.dispose]: constVoid,
});

/**
 * A test console that captures all console output for snapshot testing.
 *
 * Use this as a drop-in replacement for `createConsole` in tests where you want
 * to capture and verify console output.
 */
export interface TestConsole extends Console {
  /**
   * Gets all captured console logs. Clears the captured logs after returning
   * them.
   */
  readonly getLogsSnapshot: () => ReadonlyArray<Array<unknown>>;

  /** Clears all captured logs. */
  readonly clearLogs: () => void;
}

/**
 * Creates a test console that captures all console output for testing.
 *
 * ### Example
 *
 * ```ts
 * test("console output", () => {
 *   const testConsole = createTestConsole();
 *
 *   // Use it in place of createConsole()
 *   const deps = { console: testConsole };
 *
 *   // ... run code that logs to console
 *
 *   expect(testConsole.getLogsSnapshot()).toMatchInlineSnapshot();
 * });
 * ```
 */
export const createTestConsole = (): TestConsole => {
  const logs: Array<Array<unknown>> = [];

  return {
    enabled: true,

    log: (...args) => {
      logs.push(args);
    },
    info: (...args) => {
      logs.push(args);
    },
    warn: (...args) => {
      logs.push(args);
    },
    error: (...args) => {
      logs.push(args);
    },
    debug: (...args) => {
      logs.push(args);
    },
    time: (label) => {
      logs.push(["time", label]);
    },
    timeLog: (label, ...data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logs.push(["timeLog", label, ...data]);
    },
    timeEnd: (label) => {
      logs.push(["timeEnd", label]);
    },
    dir: (object, options) => {
      logs.push(["dir", object, options]);
    },
    table: (tabularData, properties) => {
      logs.push(["table", tabularData, properties]);
    },
    count: (label) => {
      logs.push(["count", label]);
    },
    countReset: (label) => {
      logs.push(["countReset", label]);
    },
    assert: (value, message, ...optionalParams) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logs.push(["assert", value, message, ...optionalParams]);
    },
    trace: (message, ...optionalParams) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      logs.push(["trace", message, ...optionalParams]);
    },

    getLogsSnapshot: () => {
      const snapshot = [...logs];
      logs.length = 0; // Clear captured logs
      return snapshot;
    },

    clearLogs: () => {
      logs.length = 0;
    },
  };
};
