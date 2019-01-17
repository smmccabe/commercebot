'use strict';

const {
    Builder,
    By,
    Key,
    until,
    error
} = require('selenium-webdriver');

let chrome = require('selenium-webdriver/chrome');

let argv = require('minimist')(process.argv.slice(2));

class CommerceBot {
    constructor() {
        this.step = 0;
        this.blacklist = [];
        this.driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().windowSize({
                height: 1100,
                width: 1200
            }))
            .build();        
    }

    async checkout() {
        await this.driver.get(argv['url']);

        let retry = true;

        while (retry == true) {
            let blacklistPending;

            try {
                if (0 == this.step) {
                    // Find the product search/
                    let searchLabels = ['search', 'filter']
                    let search = await this.findByList(searchLabels, '');
                    blacklistPending = await search.getId();

                    await search.sendKeys('basic', Key.RETURN);

                    this.step++;
                    this.blacklist = [];
                }

                if (1 == this.step) {
                    let product = await this.findByList(['product', 'detail', 'basic'], 'a');
                    blacklistPending = await product.getId();

                    product.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (2 == this.step) {
                    let addToCart = await this.findByList(['add to cart'], 'input');
                    blacklistPending = await addToCart.getId();
                    addToCart.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (3 == this.step) {
                    let cart = await this.findByList(['cart'], 'a');
                    blacklistPending = await cart.getId();
                    cart.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (4 == this.step) {
                    let checkout = await this.findByList(['checkout'], 'input');
                    blacklistPending = await checkout.getId();
                    checkout.click();

                    this.step++;
                    this.blacklist = [];
                }

                // Make this be an optional step somehow? combine with step 6?
                if (5 == this.step) {
                    let guest = await this.findByList(['guest'], 'input');
                    blacklistPending = await guest.getId();
                    guest.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (6 == this.step) {
                    let review = await this.findByList(['review'], 'input');
                    blacklistPending = await review.getId();
                    review.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (7 == this.step) {
                    let complete = await this.findByList(['complete'], 'input');
                    blacklistPending = await complete.getId();
                    complete.click();

                    this.step++;
                    this.blacklist = [];

                    return 'Checkout Completed'
                }

            } catch (e) {
                if (e instanceof error.NoSuchElementError) {
                    retry = false;
                }
                else {
                    console.log(e);
                }
                if(blacklistPending) {
                    this.blacklist.push(blacklistPending);
                }
            }
        }

        return 'Checkout Incomplete, failed at step ' + this.step;
    }

    async faq() {
        this.driver.get(argv['url']);

        let retry = true;
        this.step = 0;

        while (retry == true) {
            let blacklistPending;

            try {
                if (0 == this.step) {
                    let search = await this.findByList(['search'], '');
                    blacklistPending = await search.getId();

                    await search.sendKeys('faq');
                    await search.sendKeys(Key.RETURN);

                    let faq = await this.findByList(['faq', 'f.a.q.', 'F.A.Q.', 'frequently asked questions', 'help', 'Help'], 'a');
                    blacklistPending = await faq.getId();
                    faq.click();

                    await this.wait();

                    this.step++;

                    return 'FAQ Found';
                }

            } catch (e) {
                if (e instanceof error.NoSuchElementError) {
                    retry = false;
                }
                if (blacklistPending) {
                    this.blacklist += blacklistPending;
                }
            }
        }

        return 'No FAQ Found';
    }

    async findByList(list, modifier = '') {
        let search;
        let success = true;
        let exception = new error.NoSuchElementError();

        for (let term of list) {
            success = true;
            try {
                search = await this.find(term, modifier);
            } catch (e) {
                //Update to only pass on a NoSuchElementError
                success = false;
                exception = e;
            }

            if (success) break;
        }

        if (success !== false) return search;

        throw exception;
    }

    async testFinds(elements) {
        for (let element of elements) {
            if (await element.isDisplayed() && !await this.checkBlacklist(await element.getId())) {
                return element;
            }
        }

        return false
    }

    async find(term, modifier = '') {
        let search = false;
        let success = false;
        let exception = new error.NoSuchElementError();

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[name="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[name*="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[value="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[value*="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[placeholder*="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.partialLinkText(term));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[id="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[id*="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[class="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        try {
            let elements = await this.driver.findElements(By.css(modifier + '[class*="' + term + '" i]'));
            search = await this.testFinds(elements);

            if (search) return search;
        } catch (e) {
            exception = e;
        }

        throw exception;
    }

    async wait() {
        let driver = this.driver;

        await driver.wait(async function () {
            return await driver.executeScript('return document.readyState').then(function (readyState) {
                return readyState === 'complete';
            });
        });
    }

    async checkBlacklist(id) {        
        for (let item of this.blacklist) {
            if(item === id) {
                return true;
            }
        }

        return false;
    }
}

//exports.Builder = CommerceBot;
//const { CommerceBot } = require('./src/CommerceBot');

(async function() {
    let bot = new CommerceBot();

    console.log(await bot.checkout());
    //console.log(await bot.faq());
})();
