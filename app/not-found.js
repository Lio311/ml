import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="container flex flex-col items-center justify-center min-h-[60vh] py-20 text-center">
            <h2 className="text-4xl font-bold mb-4">404</h2>
            <h3 className="text-2xl font-semibold mb-6">הדף לא נמצא</h3>
            <p className="text-gray-500 mb-8 max-w-md">
                מצטערים, הדף שחיפשת אינו קיים או שהוסר.
            </p>
            <Link href="/" className="btn btn-primary px-8 py-3 text-lg">
                חזרה לדף הבית
            </Link>
        </div>
    )
}
