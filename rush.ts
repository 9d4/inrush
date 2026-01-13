const MAX_PROCESS = 5;
const SLOWEST_DUR = 3000;

function getTime() {
  return new Date().getTime();
}

async function processGroup<T>(
  processes: (() => Promise<T>)[],
  cb: (i: number, result: PromiseSettledResult<T>, avg: number) => void,
) {
  const group: Promise<any>[] = new Array(processes.length);
  const buckets: number[] = new Array();
  const avg = () => buckets.reduce((a, b) => a + b, 0) / buckets.length;

  const recordAvg = (start: number) => {
    if (buckets.length >= 3) buckets.shift();
    buckets.push(getTime() - start);
  };

  for (const p of processes) {
    const fn = async () => {
      const start = getTime();

      return Promise.resolve(p())
        .then((value) => {
          recordAvg(start);
          cb(processes.indexOf(p), { status: "fulfilled", value }, avg());
        })
        .catch((err) => {
          recordAvg(start);
          cb(processes.indexOf(p), { status: "rejected", reason: err }, avg());
        });
    };

    group.push(fn());
  }

  await Promise.all(group);
  return;
}

/**
 * Rush - A utility to run asynchronous processes with controlled concurrency
 * and dynamic adjustment based on average execution speed.
 * @param options Configuration options for Rush.
 *  - maxProcess: Maximum number of concurrent processes (default: 5).
 *  - slowestDuration: Duration to mark a process as slow (default: 3000 ms).
 */
function Rush(
  options: { maxProcess?: number; slowestDuration?: number } = {
    maxProcess: MAX_PROCESS,
    slowestDuration: SLOWEST_DUR,
  },
) {
  async function run<T>(
    processes: (() => Promise<T>)[],
    cb: (i: number, result: PromiseSettledResult<T>) => void,
    stats: (avg: number, processed: number, total: number) => void,
  ) {
    if (processes.length == 0) return;
    let queue = processes.slice(0, 1);
    let processed = 0;
    let indexStart = 0;

    while (processed <= processes.length) {
      if (queue.length == 0) {
        break;
      }

      let canProcess = 1;
      let avgSpeed = 0;

      await processGroup(queue, (i, result, avg) => {
        processed++;

        if (typeof cb === "function") cb(1 + i + indexStart, result);
        if (typeof stats === "function")
          stats(avg, processed, processes.length);

        avgSpeed = avg;
        canProcess = calculateCanProcess(
          options.maxProcess ?? MAX_PROCESS,
          options.slowestDuration ?? SLOWEST_DUR,
          avg,
        );
      });

      queue = processes.slice(processed, processed + canProcess);
      indexStart = processed;
    }
  }

  return { run };
}

function calculateCanProcess(maxProc: number, slowest: number, avgDur: number) {
  if (avgDur == 0) return maxProc;
  const canProcess = Math.ceil(slowest / avgDur);
  return Math.min(maxProc, canProcess);
}

export default Rush;
export { calculateCanProcess, processGroup };
