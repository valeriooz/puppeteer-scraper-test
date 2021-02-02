//const abc = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','z'];
const abc = ['d']
const scraperObject = {
    url: `http://vocabolariocasu.isresardegna.it/index.php?key=a&int=0&lemmi=cerca`,
    async scraper(browser){
        let page = await browser.newPage();
        var lArray = []
        let scrapedData = [];
        for(i=0; i < abc.length; i++){
            let pageUrl = `http://vocabolariocasu.isresardegna.it/index.php?key=${abc[i]}&int=0&lemmi=cerca`;
            console.log(`Navigating to ${pageUrl}...`);
            const promise = page.waitForNavigation({ waitUntil: 'networkidle2' });
            await page.goto(pageUrl);
            await promise;
            await page.waitForSelector('#lemmi')
            let urls = await page.$$eval('#lemmi a', links => {
                links = links.map(el => el.href.split('&codice=')[1])
                return links
            })
            lArray = lArray.concat(urls)
        }

        console.log(`${lArray.length} words to scrape`)
        
        let pagePromise = (id) => new Promise(async(resolve, reject) => {
            let link = `http://vocabolariocasu.isresardegna.it/definizione.php?codice=${id}`
            let dataObj = {};
            let count = 0;
            let maxTries = 5;

            // I don't know on which stuff it breaks

            while(count < maxTries) {
                try {
                    await page.goto(link);
                    break;
                } catch (error) {
                    if (++count == maxTries){return console.error(error)} else {
                        setTimeout(function() {
                            console.log('Retrying in 120 seconds')
                        },120000)
                        continue;
                    }                    
                }
            }
            
            await page.waitForTimeout(1000)
            
            while(count < maxTries) {
                try {
                    var body = await page.evaluate(() => document.body.innerHTML)
                    break;
                } catch (error) {
                    if (++count == maxTries){return console.error(error)} else {
                        setTimeout(function() {
                            console.log('Retrying in 120 seconds')
                        },120000)
                        continue;
                    }                    
                }
            }
            // Awful. Just Awful. I tried to come up with something better to separate word from text but this seemed faster. Maybe some stuff on <title>?
            // But then I'd have to make something up to avoid deleting non-title <strong> tags, a split and join?
            let bodyHTML = body.replace(/(\r\n\t|\n|\r|\t)/gm, "").replace('<strong>', '<xo>').replace('</strong> ', '</xo>').replace('<br></br>', '').replace('<br><br>', '')
            dataObj['id'] = id
            dataObj['word'] = bodyHTML.split('<xo>')[1].split('</xo>')[0]
            dataObj['it_IT'] = bodyHTML.split('<xo>')[1].split('</xo>')[1].replace(/<em>/g, '*').replace(/<\/em>/g, '*').replace(/<strong>/g, '**').replace(/<\/strong>/, '**').replace(/<span class="quadratino">□<\/span>/g, '□').replace(/<span class="smallCaps">/g, '%').replace(/<\/span>/g, '%')
            dataObj['audio'] = `http://vocabolariocasu.isresardegna.it/mp3/${id}.mp3`
            return resolve(dataObj)
            return reject
            
        });

        for(i=0; i < lArray.length; i++){
            let currentPageData = await pagePromise(lArray[i]).catch(error => {
                console.error(error)

            });
            scrapedData.push(currentPageData);
        }

        await page.close();
        return scrapedData
    }
};

module.exports = scraperObject;