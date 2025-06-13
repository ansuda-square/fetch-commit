const core = require("@actions/core");
const fetch = require("node-fetch");
const { writeFile } = require("fs").promises;
const { exec } = require("@actions/exec");
const bot = require("./profile.json");

const main = async () => {
  const url = core.getInput("url");
  const path = core.getInput("path");
  const message = core.getInput("message");
  const headers = JSON.parse(core.getInput("headers"));

  const body = await fetch(url, { headers }).then((res) => res.text());
  await writeFile(path, JSON.stringify(body, null, 2));
  core.info(`Fetched and wrote content to ${path}`);

  await exec(`git config --local user.email "${bot.email}"`);
  await exec(`git config --local user.name "${bot.name}"`);
  await exec(`git add ${path}`);

  const diffcode = await exec(`git diff --cached --quiet ${path}`, undefined, {
    ignoreReturnCode: true
  });
  core.info(`Git diff exit code: ${diffcode}`);

  if (diffcode !== 0) {
    await exec(`git commit -m "${message}"`);
    await exec(`git push`);
    core.info("Changes committed and pushed.");
  } else {
    core.info("No staged changes to commit.");
  }

  core.setOutput("diff", diffcode !== 0);
};

main().catch((error) => {
  core.setFailed(error.message);
});
