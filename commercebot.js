#!/usr/bin/env node

'use strict';

let CommerceBot = require('./src/CommerceBot');
let argv = require('minimist')(process.argv.slice(2));

(async function() {
    let headless = false;
    if (argv['headless']) {
      headless = true;
    }
    let bot = new CommerceBot(headless);

    if (argv['timer-only']) {
      let status = await bot.timer(argv['url'], argv['timer-only']);
      bot.close();
      process.exitCode = status;
      return;
    }

    console.log(await bot.checkout(argv['url']));
    console.log(await bot.faq(argv['url']));
    console.log(await bot.newsletter(argv['url']));
    if (!argv['leave-open']) {
      bot.close();
    }
})();
