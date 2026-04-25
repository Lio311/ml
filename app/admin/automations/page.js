import AutomationsClient from "./AutomationsClient";
import { getBrandName } from "../../lib/brand";

export async function generateMetadata() {
    const brandName = await getBrandName();
    return {
        title: `אוטומציות | ${brandName} Admin`,
    };
}

export default function AutomationsPage() {
    return <AutomationsClient />;
}
