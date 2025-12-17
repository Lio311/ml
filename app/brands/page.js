import pool from '../lib/db';
import BrandsClient from './BrandsClient';

export const metadata = {
    title: "המותגים שלנו | ml_tlv",
    description: "גלו את מותגי הנישה והבוטיק המובילים בעולם. כל המותגים במקום אחד.",
};

export const revalidate = 3600; // Cache for 1 hour

export default async function BrandsPage() {
    let brands = [];
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY LOWER(name) ASC');
        brands = res.rows;
        client.release();
    } catch (e) {
        console.error("Failed to fetch brands", e);
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">המותגים שלנו</h1>
                    <div className="w-16 h-1 bg-black mx-auto"></div>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        אוסף המותגים היוקרתי ביותר של בשמי נישה ובוטיק. לחצו על הלוגו לצפייה בכל הבשמים של המותג.
                    </p>
                </div>

                <BrandsClient brands={brands} />
            </div>
        </div>
    );
}
