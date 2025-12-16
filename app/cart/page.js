import CartClient from "./CartClient";

export const metadata = {
    title: "סל קניות | ml_tlv",
    description: "סל הקניות שלך.",
};

export default function CartPage() {
    return <CartClient />;
}
