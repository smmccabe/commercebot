var should = require('chai').should();
var CommerceBot = require('../src/CommerceBot');

describe('CommerceBot', () => {
    describe('checkout()', () => {
        it('should return success', async () => {
            let bot = new CommerceBot();
            const result = await bot.checkout('https://commerceplus.acromedia.com');
            result.should.equal('Checkout Completed');
        }).timeout(60000);
    });
});
