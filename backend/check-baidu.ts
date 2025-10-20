import puppeteer from 'puppeteer';

async function checkBaiduResults() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.baidu.com/s?wd=人工智能&rn=3');
    
    // 等待搜索结果加载
    await page.waitForSelector('#content_left', { timeout: 10000 });
    
    // 获取页面HTML
    const html = await page.content();
    console.log('页面HTML片段（前2000字符）:');
    console.log(html.substring(0, 2000));
    
    // 尝试不同的选择器
    const selectors = [
      '.result',
      '.c-container',
      '.result-op',
      '#content_left .c-container',
      '[data-tools]'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);
        
        if (elements.length > 0) {
          // 获取第一个元素的HTML
          const firstElementHtml = await page.evaluate((el) => {
            return el.outerHTML;
          }, elements[0]);
          
          console.log(`选择器 "${selector}" 第一个元素的HTML:`);
          console.log(firstElementHtml.substring(0, 500));
        }
      } catch (e: any) {
        console.log(`选择器 "${selector}" 出错: ${e.message}`);
      }
    }
    
  } catch (error: any) {
    console.error('检查百度搜索结果失败:', error);
  } finally {
    await browser.close();
  }
}

checkBaiduResults();