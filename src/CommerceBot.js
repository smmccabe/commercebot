const {
  Builder,
  By,
  Key,
  error,
} = require('selenium-webdriver');

const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const yaml = require('js-yaml');
const shuffle = require('./Shuffle');

module.exports = class CommerceBot {
  constructor(headless = false, browser = 'chrome') {
    const screen = {
      width: 1200,
      height: 1024,
    };

    const chromeOptions = new chrome.Options().windowSize(screen);
    const firefoxOptions = new firefox.Options().windowSize(screen);

    if (headless) {
      chromeOptions.headless();
      chromeOptions.addArguments('no-sandbox', 'disable-dev-shm-usage');
      firefoxOptions.headless();
    }

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

  async timer(url, limit = 10) {
    const start = process.hrtime();
    await this.driver.get(url);
    let end = process.hrtime(start);
    end = (end[0] * 1000) + (end[1] / 1000000);

    console.log(end);

    let success = 0;
    if (end >= limit) {
      success = 1;
    }

    return success;
  }

  async checkout(url) {
    await this.driver.get(url);
    await this.wait();

    let retry = true;
    let step = 0;

    let productNames = ['Basic', 'Test', 'Blue', 'Green', 'Red', 'T-Shirt', 'Gift'];
    productNames = shuffle(productNames);

    while (retry == true) {
      let blacklistPending;
      let searchTerm;

      try {
        if (step == 0) {
          // Find the product search/
          const searchLabels = ['search', 'filter'];
          let search = await this.findByList(searchLabels, '');
          blacklistPending = await search.getId();

          await search.click();

          search = await this.findByList(searchLabels, '');
          await search.clear();

          searchTerm = productNames.pop();

          await search.sendKeys(searchTerm, Key.RETURN);

          step++;
          this.blacklist = [];
        }

        if (step == 1) {
          const product = await this.findByList(['Product', 'detail', searchTerm], 'a');
          blacklistPending = await product.getId();

          await product.click();
          await this.wait();

          step++;
          this.blacklist = [];
        }

        if (step == 2) {
          const addToCart = await this.findByList(['add to cart'], 'input');
          blacklistPending = await addToCart.getId();
          await addToCart.click();

          step++;
          this.blacklist = [];
        }

        if (step == 3) {
          const cart = await this.findByList(['cart'], 'a');
          blacklistPending = await cart.getId();
          await cart.click();

          step++;
          this.blacklist = [];
        }

        if (step == 4) {
          const checkout = await this.findByList(['checkout'], 'input');
          blacklistPending = await checkout.getId();
          await checkout.click();

          step++;
          this.blacklist = [];
        }

        // Make this be an optional step somehow? combine with step 6?
        if (step == 5) {
          const guest = await this.findByList(['guest'], 'input');
          blacklistPending = await guest.getId();
          await guest.click();

          step++;
          this.blacklist = [];
        }

        if (step == 6) {
          await this.fillCheckout();

          const review = await this.findByList(['review'], 'input');
          blacklistPending = await review.getId();
          await review.click();

          step++;
          this.blacklist = [];
        }

        if (step == 7) {
          const complete = await this.findByList(['complete'], 'input');
          blacklistPending = await complete.getId();
          await complete.click();

          step++;
          this.blacklist = [];

          return 'Checkout Completed';
        }
      } catch (e) {
        if (e instanceof error.NoSuchElementError) {
          if (step < 4 && productNames.length > 0) {
            step = 0;
            continue;
          }
          retry = false;
        }
        if (blacklistPending) {
          this.blacklist.push(blacklistPending);
        }
      }
    }

    return `Checkout Incomplete, failed at step ${step}`;
  }

  async faq(url) {
    this.blacklist = [];
    let retry = true;

    await this.driver.get(url);
    await this.wait();

    while (retry == true) {
      let blacklistPending;

      try {
        const search = await this.findByList(['search', 'filter'], '');
        blacklistPending = await search.getId();

        await search.sendKeys('faq', Key.RETURN);

        await this.wait();

        const faq = await this.findByList(['FAQ', 'faq', 'f.a.q.', 'F.A.Q.', 'frequently asked questions', 'help', 'Help'], 'a');
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
    let step = 0;

    await this.driver.get(url);
    await this.wait();

    while (retry == true) {
      let blacklistPending;

      try {
        if (step == 0) {
          const newsletter = await this.findByList(['newsletter'], 'input');
          blacklistPending = await newsletter.getId();

          await newsletter.sendKeys('fake@email.com');

          return 'Newsletter signup found';
        }
        if (step == 1) {
          const newsletter = await this.findByList(['newsletter'], 'form');
          blacklistPending = await newsletter.getId();
          const email = await newsletter.findElement(By.css('input[name*="email"]'));

          await email.sendKeys('fake@email.com');

          return 'Newsletter signup found';
        }
      } catch (e) {
        if (e instanceof error.NoSuchElementError) {
          if (step < 1) {
            step++;
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

    for (const term of list) {
      success = true;
      try {
        search = await this.find(term, modifier);
      } catch (e) {
        // Update to only pass on a NoSuchElementError
        success = false;
        exception = e;
      }

      if (success) break;
    }

    if (success !== false) return search;

    throw exception;
  }

  async testFinds(elements) {
    for (const element of elements) {
      if (await element.isDisplayed() && !await this.checkBlacklist(await element.getId())) {
        return element;
      }
    }

    return false;
  }

  async find(term, modifier = '') {
    let search = false;
    let exception = new error.NoSuchElementError();

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[name="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[name*="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[value="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[value*="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[placeholder*="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.partialLinkText(term));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[id="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[id*="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[class="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    try {
      const elements = await this.driver.findElements(By.css(`${modifier}[class*="${term}" i]`));
      search = await this.testFinds(elements);

      if (search) return search;
    } catch (e) {
      exception = e;
    }

    throw exception;
  }

  async wait() {
    const { driver } = this;

    await driver.wait(async () => await driver.executeScript('return document.readyState').then((readyState) => readyState === 'complete'));
  }

  async checkBlacklist(id) {
    for (const item of this.blacklist) {
      if (item === id) {
        return true;
      }
    }

    return false;
  }

  async fillCheckout() {
    try {
      let fields = await this.driver.findElements(By.css('input[type="text"]:required'));

      for (const field of fields) {
        // If the field already has text in it, like from an account, skip it.
        const value = await field.getAttribute('value');
        if (value.length > 0) {
          continue;
        }

        const name = await field.getAttribute('name');

        if (name.includes('postal') || name.includes('zip')) {
          await field.sendKeys('60613');
          continue;
        }

        if (name.includes('state')) {
          await field.sendKeys('Illinois');
          continue;
        }

        if (name.includes('address') && name.includes('line')) {
          await field.sendKeys('1060 West Addison');
          continue;
        }

        await field.sendKeys('Test');
      }

      fields = await this.driver.findElements(By.css('input[type="email"]:required'));
      for (const field of fields) {
        // If the field already has text in it, like from an account, skip it.
        const value = await field.getAttribute('value');
        if (value.length > 0) {
          continue;
        }

        await field.sendKeys('test765463@example.com');
      }

      fields = await this.driver.findElements(By.css('input[type="tel"]:required'));
      for (const field of fields) {
        // If the field already has text in it, like from an account, skip it.
        const value = await field.getAttribute('value');
        if (value.length > 0) {
          continue;
        }

        await field.sendKeys('5558675309');
      }

      fields = await this.driver.findElements(By.css('select[name*="state"]:required, select[name*="area"]:required'));
      for (const field of fields) {
        await field.findElement(By.css('option[value="IL"]')).click();
      }
    } catch (e) {
      // Errors are fine, we're just trying to fill out as best we can.
    }

    return true;
  }
};
