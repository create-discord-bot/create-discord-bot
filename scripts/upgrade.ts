import { exec } from "child_process";

const toCheck = [
  "./templates/javascript/default/package.json",
  "./templates/javascript/pino/package.json",
  "./templates/typescript/default/package.json",
  "./templates/typescript/pino/package.json",
];

toCheck.forEach((value) => {
  exec(`npx ncu -u --packageFile ${value}`);
});
