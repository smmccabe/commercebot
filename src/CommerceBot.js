const {
    Builder,
    By,
    Key,
    until,
    error
} = require('selenium-webdriver');

let chrome = require('selenium-webdriver/chrome');
let firefox = require('selenium-webdriver/firefox');

module.exports = class CommerceBot {
    constructor(headless = false, browser = 'chrome') {
        const screen = {
            width: 1200,
            height: 1024,
        };

        let chromeOptions = new chrome.Options().windowSize(screen);
        let firefoxOptions = new firefox.Options().windowSize(screen);

        if(headless) {
            chromeOptions.headless();
            chromeOptions.addArguments('no-sandbox', 'disable-dev-shm-usage');
            firefoxOptions.headless();
        }

        this.step = 0;
        this.blacklist = [];
        this.driver = new Builder()
            .forBrowser(browser)
            .setChromeOptions(chromeOptions)
            .setFirefoxOptions(firefoxOptions)
            .build();

    }

    async close() {
        await this.driver.close();
    }

    async checkout(url) {
        await this.driver.get(url);
        await this.wait();

        let retry = true;

        while (retry == true) {
            let blacklistPending;

            try {
                if (0 == this.step) {
                    // Find the product search/
                    let searchLabels = ['search', 'filter']
                    let search = await this.findByList(searchLabels, '');
                    blacklistPending = await search.getId();

                    await search.click();

                    search = await this.findByList(searchLabels, '');

                    await search.sendKeys('basic', Key.RETURN);

                    this.step++;
                    this.blacklist = [];
                }

                if (1 == this.step) {
                    let product = await this.findByList(['product', 'detail', 'basic'], 'a');
                    blacklistPending = await product.getId();

                    await product.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (2 == this.step) {
                    let addToCart = await this.findByList(['add to cart'], 'input');
                    blacklistPending = await addToCart.getId();
                    await addToCart.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (3 == this.step) {
                    let cart = await this.findByList(['cart'], 'a');
                    blacklistPending = await cart.getId();
                    await cart.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (4 == this.step) {
                    let checkout = await this.findByList(['checkout'], 'input');
                    blacklistPending = await checkout.getId();
                    await checkout.click();

                    this.step++;
                    this.blacklist = [];
                }

                // Make this be an optional step somehow? combine with step 6?
                if (5 == this.step) {
                    let guest = await this.findByList(['guest'], 'input');
                    blacklistPending = await guest.getId();
                    await guest.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (6 == this.step) {
                    await this.fillCheckout();

                    let review = await this.findByList(['review'], 'input');
                    blacklistPending = await review.getId();
                    await review.click();

                    this.step++;
                    this.blacklist = [];
                }

                if (7 == this.step) {
                    let complete = await this.findByList(['complete'], 'input');
                    blacklistPending = await complete.getId();
                    await complete.click();

                    this.step++;
                    this.blacklist = [];

                    return 'Checkout Completed'
                }

            } catch (e) {
                if (e instanceof error.NoSuchElementError) {
                    retry = false;
                }
                if (blacklistPending) {
                    this.blacklist.push(blacklistPending);
                }
            }
        }

        return 'Checkout Incomplete, failed at step ' + this.step;
    }

    async faq(url) {
        this.blacklist = [];
        let retry = true;
        this.step = 0;

        await this.driver.get(url);
        await this.wait();

        while (retry == true) {
            let blacklistPending;

            try {
                let search = await this.findByList(['search'], '');
                blacklistPending = await search.getId();

                await search.sendKeys('faq', Key.RETURN);

                await this.wait();

                let faq = await this.findByList(['faq', 'f.a.q.', 'F.A.Q.', 'frequently asked questions', 'help', 'Help'], 'a');
                blacklistPending = await faq.getId();
                await faq.click();

                return 'FAQ Found';
            } catch (e) {
                if (e instanceof error.NoSuchElementError) {
                    retry = false;
                }
                if (blacklistPending) {
                    this.blacklist.push(blacklistPending);
                }
            }
        }

        return 'No FAQ Found';
    }

    async newsletter(url) {
        this.blacklist = [];
        let retry = true;
        this.step = 0;

        await this.driver.get(url);
        await this.wait();

        while (retry == true) {
            let blacklistPending;

            try {
                if (0 == this.step) {
                    let newsletter = await this.findByList(['newsletter'], 'input');
                    blacklistPending = await newsletter.getId();

                    await newsletter.sendKeys('fake@email.com');

                    return 'Newsletter signup found';
                }
                if (1 == this.step) {
                    let newsletter = await this.findByList(['newsletter'], 'form');
                    blacklistPending = await newsletter.getId();
                    let email = await newsletter.findElement(By.css('input[name*="email"]'));

                    await email.sendKeys('fake@email.com');

                    return 'Newsletter signup found';
                }

            } catch (e) {
                if (e instanceof error.NoSuchElementError) {
                    if (this.step < 1) {
                        this.step++;
                    } else {
                        retry = false;
                    }
                }
                if (blacklistPending) {
                    this.blacklist.push(blacklistPending);
                }
            }
        }

        return 'No newsletter found';
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
            if (item === id) {
                return true;
            }
        }

        return false;
    }

    async fillCheckout() {
        try {
            let fields = await this.driver.findElements(By.css('input[type="text"]:required'));

            for (let field of fields) {
                //If the field already has text in it, like from an account, skip it.
                let value = await field.getAttribute('value');
                if(value.length > 0) {
                    continue;
                }

                let name = await field.getAttribute('name');

                if(name.includes('postal') || name.includes('zip')) {
                    await field.sendKeys('60613');
                    continue;
                }

                if (name.includes('state')) {
                    await field.sendKeys('Illinois');
                    continue;
                }

                if(name.includes('address') && name.includes('line')) {
                    await field.sendKeys('1060 West Addison');
                    continue;
                }

                await field.sendKeys('Test');
            }

            fields = await this.driver.findElements(By.css('input[type="email"]:required'));
            for (let field of fields) {
                //If the field already has text in it, like from an account, skip it.
                let value = await field.getAttribute('value');
                if (value.length > 0) {
                    continue;
                }

                await field.sendKeys('test765463@example.com');
            }

            fields = await this.driver.findElements(By.css('input[type="tel"]:required'));
            for (let field of fields) {
                //If the field already has text in it, like from an account, skip it.
                let value = await field.getAttribute('value');
                if (value.length > 0) {
                    continue;
                }

                await field.sendKeys('5558675309');
            }

            fields = await this.driver.findElements(By.css('select[name*="state"]:required, select[name*="area"]:required'));
            for (let field of fields) {
                await field.findElement(By.css('option[value="IL"]')).click();
            }
        }
        catch (e) {
            // Errors are fine, we're just trying to fill out as best we can.
        }

        return true;
    }
}