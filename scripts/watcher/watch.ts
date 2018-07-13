import Joi from "joi";

import SaneWatcher from "./SaneWatcher";
import { Config, configSchema, Options, WatchConfig, Watcher } from "./types";

// Polyfill the asyncIterator symbol.
if (Symbol.asyncIterator === undefined) {
  (Symbol as any).asyncIterator = Symbol.for("asyncIterator");
}

async function beginWatch(
  watcher: Watcher,
  key: string,
  config: WatchConfig,
  rootDir: string
) {
  const { paths, ignore, executor } = config;
  if (executor.onInit) {
    await executor.onInit();
  }
  for await (const filePath of watcher.watch(rootDir, paths, { ignore })) {
    // tslint:disable-next-line:no-console
    console.log(`Execute "${key}"`);
    executor.execute(filePath);
  }
}

function setupCleanup(watcher: Watcher, config: Config) {
  ["SIGINT", "SIGTERM"].forEach(signal =>
    process.once(signal as any, async () => {
      const cleanups = [];
      if (watcher.onCleanup) {
        cleanups.push(watcher.onCleanup());
      }
      for (const key of Object.keys(config.watchers)) {
        if (config.watchers[key].executor.onCleanup) {
          cleanups.push(config.watchers[key].executor.onCleanup!());
        }
      }
      await Promise.all(cleanups);
      process.exit(0);
    })
  );
}

function filterOnly(config: Config, only: string[]) {
  for (const key of Object.keys(config.watchers)) {
    if (only.indexOf(key) === -1) {
      // tslint:disable-next-line:no-console
      console.log(`Disabled watcher "${key}"`);
      delete config.watchers[key];
    }
  }
}

export default async function watch(config: Config, options?: Options) {
  Joi.assert(config, configSchema);
  const watcher: Watcher = config.backend || new SaneWatcher();
  const rootDir = config.rootDir || process.cwd();
  if (options && options.only && options.only.length > 0) {
    filterOnly(config, options.only);
  }
  setupCleanup(watcher, config);
  if (watcher.onInit) {
    await watcher.onInit();
  }
  for (const key of Object.keys(config.watchers)) {
    // tslint:disable-next-line:no-console
    console.log(`Start watcher "${key}"`);
    const watcherConfig = config.watchers[key];
    beginWatch(watcher, key, watcherConfig, rootDir);
  }
}
