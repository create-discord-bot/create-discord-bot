import { execSync } from "child_process";

const toCheck = [
  "./templates/javascript/default/package.json",
  "./templates/javascript/pino/package.json",
  "./templates/typescript/default/package.json",
  "./templates/typescript/pino/package.json",
];

console.clear();

for (let i = 0; i < toCheck.length; i++) {
  console.log(
    `\x1b[1mCurrently Checking: ${toCheck[i]
      .replace("./templates/", "")
      .replace("/package.json", "")}\x1b[0m\n`
  );
  execSync(`npx ncu -u --packageFile ${toCheck[i]}`, {
    stdio: [0, 1, 2],
  });
  console.log("\n");
}
