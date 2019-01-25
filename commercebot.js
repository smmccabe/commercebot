'use strict';

let CommerceBot = require('./src/CommerceBot');
let argv = require('minimist')(process.argv.slice(2));

(async function() {
    let bot = new CommerceBot();

    console.log(await bot.checkout(argv['url']));
    console.log(await bot.faq(argv['url']));
    console.log(await bot.newsletter(argv['url']));
    //bot.close();
})();
