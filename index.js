const core = require("@actions/core");
const fetch = require("node-fetch");
const {writeFileSync} = require("fs");
const {exec} = require("@actions/exec");
const bot = require("./profile.json");

const main = async () => {
    try {
        const url = core.getInput("url");
        const path = core.getInput("path");
        const message = core.getInput("message");

        const rawHeaders = core.getInput("headers");
        let headers = {};
        try {
            headers = JSON.parse(rawHeaders);
        } catch (err) {
            throw new Error(`Invalid JSON in 'headers' input: ${err.message}`);
        }

        // 获取并格式化 JSON 响应
        const response = await fetch(url, {headers});

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        const formattedJson = JSON.stringify(jsonData, null, 2); // 缩进 2 空格

        writeFileSync(path, formattedJson);

        // Git 操作
        await exec(`git config --local user.email "${bot.email}"`);
        await exec(`git config --local user.name "${bot.name}"`);
        await exec(`git add ${path}`);
        const diffcode = await exec(`git diff --cached --quiet ${path}`, undefined, {
            ignoreReturnCode: true
        });
        if (diffcode)
            await exec(`git commit -m "${message}"`);
        await exec(`git push`);

        core.setOutput("diff", Boolean(diffcode));
    } catch (error) {
        core.setFailed(error.message);
    }
};

main();
