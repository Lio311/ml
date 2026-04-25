import AutomationsClient from "./AutomationsClient";
import { getBrandName } from "../../lib/brand";

export async function generateMetadata() {
    return {
        title: `אוטומציות | Admin`,
    };
}

export default function AutomationsPage() {
    return <AutomationsClient />;
}
