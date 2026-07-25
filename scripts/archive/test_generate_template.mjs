import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import { getBatchPerfumeItemsHtml, getTemplate, getSystemDefaults } from './app/lib/email.js';

async function main() {
    const newPerfumes = [
        {
            id: 999,
            brand: 'TestBrand',
            model: 'TestModel',
            image_url: 'https://test.com/img.png',
            price_2ml: '100'
        }
    ];

    const itemsHtml = getBatchPerfumeItemsHtml(newPerfumes);
    const tpl = await getTemplate('new_perfumes_batch', { itemsHtml }, () => {
        const defaultTplHtml = getSystemDefaults()['new_perfumes_batch'].content_html;
        return defaultTplHtml.replace('{{itemsHtml}}', itemsHtml);
    });

    console.log(tpl.html.includes('TestBrand') ? 'SUCCESS: Found TestBrand' : 'FAILED: Did not find TestBrand');
    console.log(tpl.html.includes('Brand 1') ? 'FAILED: Found Brand 1 (Mock data)' : 'SUCCESS: No mock data');
    
    process.exit(0);
}

main().catch(console.error);
