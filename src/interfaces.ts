import { MenuItem, OrderItem, StoredCartItem } from './types';

// interfaces.ts
export interface LocalStorageService {
    getStoredCart(orderId: string): StoredCartItem[];
    addToCart(orderId: string, item: StoredCartItem): StoredCartItem[];
    clearCart(orderId: string): void;
}

export interface OrderService {
    getOrderItems(orderId: string): Promise<OrderItem[]>;
    addOrderItem(params: { menuItemId: string; orderId: string }): Promise<OrderItem>;
    updateOrderQuantity(params: {
        menuItemId: string;
        orderId: string;
        quantity: number
    }): Promise<OrderItem>;
    removeOrderItem(params: { menuItemId: string; orderId: string }): Promise<void>;
}

export interface MenuService {
    getMenuItems(params: { orgId: string }): Promise<MenuItem[]>;
}