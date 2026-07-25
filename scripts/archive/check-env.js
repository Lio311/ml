
require('dotenv').config();
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "Missing");
console.log("CLOUDINARY_URL:", process.env.CLOUDINARY_URL ? "Exists" : "Missing");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Exists" : "Missing");
