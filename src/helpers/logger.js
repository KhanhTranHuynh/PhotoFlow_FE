// simple-logger.js
// Siêu nhỏ, không cần winston. Có thể dùng boolean hoặc function predicate để quyết định in log.

// enabled = true => hiện log
// enabled = false => không hiện log
function createSimpleLogger(enabled = true) {
  let _enabled = enabled;

  const should = (level) =>
    typeof _enabled === "function" ? _enabled(level) : !!_enabled;

  return {
    setEnabled(v) {
      _enabled = v;
    },
    log(...args) {
      if (should("log")) console.log(...args);
    },
    info(...args) {
      if (should("info")) console.info(...args);
    },
    warn(...args) {
      if (should("warn")) console.warn(...args);
    },
    error(...args) {
      if (should("error")) console.error(...args);
    },
    debug(...args) {
      if (should("debug")) (console.debug || console.log)(...args);
    },
  };
}

const logger = createSimpleLogger();
export default logger;
