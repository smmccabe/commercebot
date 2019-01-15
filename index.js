const {
    Builder,
    By,
    Key,
    until
} = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://commerceplus.acromedia.com/');
        let search = await driver.findElement(By.css('.site-header [name="filter"]'));
        
        await search.sendKeys('basic', Key.RETURN);
        await driver.wait(until.titleContains('Catalogue'), 1000);

        await driver.findElement(By.css('a[class*="product"]')).click();
        await driver.findElement(By.css('input[value="Add to cart"')).click();
        await driver.findElement(By.partialLinkText("Cart")).click();
        await driver.findElement(By.css('input[value*="Checkout"]')).click();

        await driver.findElement(By.css('input[value*="Guest"]')).click();

        await driver.findElement(By.css('input[value*="review"]')).click();

        await driver.findElement(By.css('input[value*="complete"]')).click();
    } 
    finally {
        //await driver.quit();
    }
})();