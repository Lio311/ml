"use client";

import { useState, useEffect } from "react";

export default function MigrationPage() {
    const [status, setStatus] = useState("Idle");

    const runMigration = async () => {
        setStatus("Running...");
        try {
            const res = await fetch('/api/admin/migrate-db');
            const data = await res.json();
            setStatus(JSON.stringify(data, null, 2));
        } catch (e) {
            setStatus("Error: " + e.message);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
            <button onClick={runMigration} className="bg-blue-600 text-white px-4 py-2 rounded">Run Migration (Add name_he)</button>
            <pre className="mt-4 bg-gray-100 p-4 rounded">{status}</pre>
        </div>
    );
}
