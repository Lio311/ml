import pool from "../../lib/db";
import Link from "next/link";
import ProductCard from "../../components/ProductCard";
import StarRating from "../../components/StarRating";
import WishlistHeart from "../../components/WishlistHeart";
import AddToCartAdvanced from "../../components/ProductCard";
import FragrancePyramid from "../../components/FragrancePyramid";

export default async function ProductPage(props) {
    const params = await props.params;
    const { id } = params;

    const res = await pool.query(`
        SELECT p.*, b.logo_url 
        FROM products p 
        LEFT JOIN brands b ON p.brand = b.name 
        WHERE p.id = $1
    `, [id]);
    const product = res.rows[0];

    if (!product) {
        return <div className="p-20 text-center">מוצר לא נמצא</div>;
    }

    // Related products (simple logic: same category)
    const relatedRes = await pool.query('SELECT * FROM products WHERE category = $1 AND id != $2 LIMIT 4', [product.category, id]);
    const related = relatedRes.rows;

    return (
        <div className="container py-12">
            <div className="flex flex-col md:flex-row gap-12 mb-20">
                {/* Image */}
                <div className="w-full md:w-1/2 aspect-square bg-white rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm p-4 group">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-6xl text-gray-300">🧴</div>
                    )}

                    <div className="absolute top-4 left-4 z-10">
                        <WishlistHeart productId={product.id} />
                    </div>

                    {product.is_limited && (
                        <span className="absolute top-4 right-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                            מלאי מוגבל
                        </span>
                    )}
                </div>

                {/* Details */}
                <div className="w-full md:w-1/2 space-y-8">
                    <div>
                        <div className="text-gray-500 mb-2">{product.category}</div>
                        <h1 className="text-4xl font-bold mb-2">{product.name}</h1>

                        <div className="mb-4">
                            <StarRating productId={product.id} />
                        </div>

                        {product.logo_url && (
                            <div className="mb-6 w-32 h-16 flex items-center justify-start"> {/* Fixed container */}
                                <Link href={`/catalog?brand=${encodeURIComponent(product.brand)}`} className="block w-full h-full relative">
                                    <img
                                        src={product.logo_url}
                                        alt={product.brand}
                                        className="w-full h-full object-contain hover:opacity-80 transition-opacity"
                                    />
                                </Link>
                            </div>
                        )}

                        <div className="text-lg text-gray-600 leading-relaxed">
                            {product.description || `תיאור מוצר מורחב יבוא כאן... ריחות של ${product.category} בשילוב תווים ייחודיים.`}
                        </div>

                        {/* Fragrance Pyramid Visualization */}
                        <div className="mt-8">
                            <FragrancePyramid
                                top={product.top_notes}
                                middle={product.middle_notes}
                                base={product.base_notes}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border">
                        <h3 className="font-bold mb-4">בחר גודל והוסף לסל:</h3>
                        {/* Reusing ProductCard purely for logic is hacky, but consistent with requested "simple" flow. 
                            Ideally would be refactored, but for now we put a "Card" style adder or just the buttons.
                            To save creating a new component file right now, I will render a specialized client component inline if needed,
                            but actually I'll just use the existing ProductCard logic but hidden? No.
                            
                            Let's just use ProductCard for now as a "mini card" or just let the user use the card below.
                            Wait, the user wants "AddToCart".
                            I'll use a Client Component Wrapper for AddToCart buttons.
                        */}
                        <ProductActionsClient product={product} />
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-8">אולי תאהב גם</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {related.map(p => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Client Component for Actions
import ProductActionsClient from "./ProductActionsClient";
