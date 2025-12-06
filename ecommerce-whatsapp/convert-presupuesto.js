const fs = require("fs");
const puppeteer = require("puppeteer");
(async ()=>{
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const htmlPath = 'PRESUPUESTO_Magnolia_Novedades_ESTANDAR.html';
    const content = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(content, { waitUntil: 'networkidle0' });
    await page.pdf({ path: 'PRESUPUESTO_Magnolia_Novedades_ESTANDAR.pdf', format: 'A4', printBackground: true });
    await browser.close();
    console.log('PDF generado en PRESUPUESTO_Magnolia_Novedades_ESTANDAR.pdf');
  } catch (err) {
    console.error('Error generando PDF:', err);
    process.exit(1);
  }
})();
