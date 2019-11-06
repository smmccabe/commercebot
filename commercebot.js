#!/usr/bin/env node


const CommerceBot = require('./src/CommerceBot');
const argv = require('minimist')(process.argv.slice(2));

(async function () {
  let headless = false;
  if (argv.headless) {
    headless = true;
  }
  const bot = new CommerceBot(headless);

  if (argv['timer-only']) {
    const status = await bot.timer(argv.url, argv['timer-only']);
    bot.close();
    process.exitCode = status;
    return;
  }

  console.log(await bot.checkout(argv.url));
  console.log(await bot.faq(argv.url));
  console.log(await bot.newsletter(argv.url));
  if (!argv['leave-open']) {
    bot.close();
  }
}());
