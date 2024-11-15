import { LocalStorageService, MenuService, OrderService } from './interfaces';
import { MenuItem, OrderItem, StoredCartItem } from './types';
// implementations.ts
export class LocalStorageServiceImpl implements LocalStorageService {
    private getKey(orderId: string): string {
        return `cart_${orderId}`;
    }

    getStoredCart(orderId: string): StoredCartItem[] {
        const stored = localStorage.getItem(this.getKey(orderId));
        return stored ? JSON.parse(stored) : [];
    }

    addToCart(orderId: string, item: StoredCartItem): StoredCartItem[] {
        const cart = this.getStoredCart(orderId);
        const existingItemIndex = cart.findIndex(i => i.menuItemId === item.menuItemId);

        if (existingItemIndex >= 0) {
            cart[existingItemIndex] = {
                ...cart[existingItemIndex],
                quantity: cart[existingItemIndex].quantity + item.quantity
            };
        } else {
            cart.push(item);
        }

        localStorage.setItem(this.getKey(orderId), JSON.stringify(cart));
        return cart;
    }

    clearCart(orderId: string): void {
        localStorage.removeItem(this.getKey(orderId));
    }
}

export class MenuOrderManager {
    constructor(
        private menuService: MenuService,
        private orderService: OrderService,
        private localStorage: LocalStorageService
    ) { }

    async getMenuItems(orgId: string): Promise<MenuItem[]> {
        return this.menuService.getMenuItems({ orgId });
    }

    async addItemToOrder(params: {
        orderId: string;
        menuItem: MenuItem;
        quantity: number;
    }): Promise<OrderItem> {
        const orderItem = await this.orderService.addOrderItem({
            orderId: params.orderId,
            menuItemId: params.menuItem.id
        });

        this.localStorage.addToCart(params.orderId, {
            ...orderItem,
            name: params.menuItem.name
        });

        return orderItem;
    }

    async confirmOrder(orderId: string): Promise<boolean> {
        const cart = this.localStorage.getStoredCart(orderId);
        if (cart.length === 0) return false;

        // Here you would typically make an API call to confirm the order
        // For now, we'll just clear the cart
        this.localStorage.clearCart(orderId);
        return true;
    }
}
