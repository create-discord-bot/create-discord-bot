import { parentPort, workerData } from "worker_threads";
import { downloadTemplate } from "giget";

const { repository, directoryPath } = workerData;

await downloadTemplate(repository, {
  dir: directoryPath,
  force: true,
});
parentPort?.postMessage("Finished.");
