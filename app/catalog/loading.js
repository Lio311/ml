export default function CatalogLoading() {
    return (
        <div className="container pt-12 pb-4">
            <div className="h-10 w-48 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
            <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mx-auto mb-10 hidden md:block"></div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Filters Sidebar Skeleton */}
                <div className="w-full md:w-64 space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border-b border-gray-100 pb-4">
                            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="h-4 w-full bg-gray-100 animate-pulse rounded"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Product Grid Skeleton */}
                <div className="flex-1">
                    <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="h-6 w-full md:w-64 bg-gray-100 animate-pulse rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="aspect-[4/5] w-full bg-gray-200 animate-pulse rounded-lg"></div>
                                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mt-2"></div>
                                <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded"></div>
                                <div className="h-5 w-1/4 bg-gray-200 animate-pulse rounded mt-2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
