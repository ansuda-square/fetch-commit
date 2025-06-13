const core = require("@actions/core");
const fetch = require("node-fetch");
const { createWriteStream } = require("fs"); // 使用 createWriteStream
const { exec } = require("@actions/githube/exec");
const bot = require("./profile.json");

const main = async () => {
  const url = core.getInput("url");
  const path = core.getInput("path");
  const message = core.getInput("message");
  const headers = JSON.parse(core.getInput("headers"));

  // 1. 发起请求并获取响应
  const response = await fetch(url, { headers });

  // 检查请求是否成功
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  // 2. 创建一个可写流
  const fileStream = createWriteStream(path);

  // 3. 使用管道将响应体直接写入文件
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on("error", reject);
    fileStream.on("finish", resolve);
  });

  // 后续的 git 操作保持不变
  await exec(`git config --local user.email "${bot.email}"`);
  await exec(`git config --local user.name "${bot.name}"`);
  await exec(`git add ${path}`);
  await exec(`git commit -m "${message}"`);
  await exec(`git push`);
 
};

main().catch((error) => {
  core.setFailed(error.message);
});
