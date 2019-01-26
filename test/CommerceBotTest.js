var should = require('chai').should();
var CommerceBot = require('../src/CommerceBot');

describe('CommerceBot', () => {
    describe('checkout()', () => {
        it('Should complete checkout - Commerce Plus', async () => {
            let bot = new CommerceBot(true);
            const result = await bot.checkout('https://commerceplus.acromedia.com');
            result.should.equal('Checkout Completed');
            await bot.close();
        }).timeout(60000);
        it('Should reach step 7 - USI', async () => {
            let bot = new CommerceBot(true);
            const result = await bot.checkout('https://www.usi-laminate.com');
            result.should.equal('Checkout Incomplete, failed at step 7');
            await bot.close();
        }).timeout(60000);
    });
    describe('faq()', () => {
        it('Should not find an FAQ', async () => {
            let bot = new CommerceBot(true);
            const result = await bot.faq('https://commerceplus.acromedia.com');
            result.should.not.equal('FAQ Found');
            await bot.close();
        }).timeout(60000);
    });
    describe('newsletter()', () => {
        it('Should find a newsletter signup', async () => {
            let bot = new CommerceBot(true);
            const result = await bot.newsletter('https://commerceplus.acromedia.com');
            result.should.equal('Newsletter signup found');
            await bot.close();
        }).timeout(60000);
    });
});
