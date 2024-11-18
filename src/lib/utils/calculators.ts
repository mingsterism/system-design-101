import { MenuItem, CartItemCustomization, CartItem } from "../../types";

export const calculateItemPrice = (baseItem: MenuItem, customizations: CartItemCustomization): number => {
    let total = baseItem.price;

    if (Array.isArray(baseItem.customizationOptions)) {
        for (const option of baseItem.customizationOptions) {
            const selections = customizations[option.id] || [];
            const optionPrices = selections
                .map(selection => option.options.find(opt => opt.id === selection)?.price || 0);
            total += optionPrices.reduce((sum, price) => sum + price, 0);
        }
    }

    return total;
};

export const calculateOrderTotals = (items: CartItem[]): {
    subtotal: number;
    tax: number;
    total: number;
} => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax rate
    return {
        subtotal,
        tax,
        total: subtotal + tax
    };
};

