// types.ts
export interface MenuItem {
    id: string;
    name: string;
    price: number;
}

export interface OrderItem {
    id: string;
    menuItemId: string;
    quantity: number;
    price: number;
}

export interface StoredCartItem extends OrderItem {
    name: string;
}

