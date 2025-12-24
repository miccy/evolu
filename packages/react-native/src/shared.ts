import {
	type CreateSqliteDriverDep,
	createConsole,
	createLocalAuth,
	createRandom,
	createRandomBytes,
	createTime,
	createWebSocket,
	type LocalAuth,
	type SecureStorage,
} from "@evolu/common";
import {
	createDbWorkerForPlatform,
	type EvoluDeps,
	type ReloadAppDep,
} from "@evolu/common/local-first";

const console = createConsole();
const randomBytes = createRandomBytes();
const time = createTime();

export const createSharedEvoluDeps = (
	deps: CreateSqliteDriverDep & ReloadAppDep,
): EvoluDeps => ({
	...deps,
	console,
	createDbWorker: () =>
		createDbWorkerForPlatform({
			...deps,
			console,
			createWebSocket,
			random: createRandom(),
			randomBytes,
			time,
		}),
	randomBytes,
	time,
});

export const createSharedLocalAuth = (
	secureStorage: SecureStorage,
): LocalAuth =>
	createLocalAuth({
		randomBytes,
		secureStorage,
	});
