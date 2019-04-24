'use strict';

let CommerceBot = require('./src/CommerceBot');
let argv = require('minimist')(process.argv.slice(2));

(async function() {
    let bot = new CommerceBot();

    if (argv['timer-only']) {
      console.log(await bot.timer(argv['url']));
      bot.close();
      return;
    }

    console.log(await bot.checkout(argv['url']));
    console.log(await bot.faq(argv['url']));
    console.log(await bot.newsletter(argv['url']));
    if (argv['close']) {
      bot.close();
    }
})();
