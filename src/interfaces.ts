import {
    Order, OrderValidation, OrderConfirmation,
    TimeSlot,
    Review, ReviewStats, TableSeating, GroupOrder, User, CartItem, MenuItem, OrderItem, StoredCartItem
} from './types';

// interfaces.ts
export interface LocalStorageService {
    getStoredCart(orderId: string): StoredCartItem[];
    addToCart(orderId: string, item: StoredCartItem): StoredCartItem[];
    clearCart(orderId: string): void;
}

export interface MenuService {
    getMenuItems(params: { search?: string; filters?: any }): Promise<MenuItem[]>;
    getMenuCategories(): Promise<string[]>;
    getMenuItemDetails(id: string): Promise<MenuItem>;
    checkItemAvailability(id: string): Promise<boolean>;
    getPopularItems(): Promise<MenuItem[]>;
    searchItems(term: string): Promise<MenuItem[]>;
}

export interface ReviewService {
    getMenuItemReviews(menuItemId: string): Promise<Review[]>;
    getReviewStats(menuItemId: string): Promise<ReviewStats>;
}

export interface OrderService {
    createOrder(params: {
        userId: string;
        tableId: string;
        groupOrderId?: string;
        items: CartItem[];
    }): Promise<{ id: string }>;
    addOrderItem(params: { orderId: string; menuItemId: string }): Promise<OrderItem>;
    getActiveOrders(userId: string): Promise<OrderItem[]>;
    updateOrderStatus(orderId: string, status: string): Promise<boolean>;
    getOrderItems(orderId: string): Promise<OrderItem[]>;
    addOrderItem(params: { menuItemId: string; orderId: string }): Promise<OrderItem>;
    updateOrderQuantity(params: {
        menuItemId: string;
        orderId: string;
        quantity: number
    }): Promise<OrderItem>;
    removeOrderItem(params: { menuItemId: string; orderId: string }): Promise<void>;
    getEstimatedPreparationTime(menuItemIds: string[]): Promise<number>;
    validateOrder(order: Partial<Order>): Promise<OrderValidation>;
    getOrderConfirmation(orderId: string): Promise<OrderConfirmation>;

}

export interface CartService {
    addToCart(item: CartItem): Promise<CartItem>;
    getCartItems(userId: string): Promise<CartItem[]>;
    updateCartItem(cartItemId: string, updates: Partial<CartItem>): Promise<CartItem>;
    removeCartItem(cartItemId: string): Promise<boolean>;
    clearCart(userId: string): Promise<boolean>;
}

export interface TableService {
    getTableByQR(qrCode: string): Promise<TableSeating>;
    validateTableStatus(tableId: string): Promise<boolean>;
}

export interface QRCodeService {
    validateQRCode(code: string): Promise<boolean>;
    getTableFromQR(code: string): Promise<TableSeating>;
}

export interface GroupOrderService {
    createGroupOrder(params: { tableId: string; userId: string }): Promise<GroupOrder>;
    joinGroupOrder(groupId: string, userId: string): Promise<boolean>;
    getGroupOrderItems(groupId: string): Promise<CartItem[]>;
}

export interface UserService {
    getCurrentUser(): Promise<User>;
    getUserPreferences(userId: string): Promise<any>;
}

export interface ScheduleService {
    getAvailablePickupTimes(): Promise<TimeSlot[]>;
    validatePickupTime(time: string): Promise<boolean>;
    getEstimatedPickupTime(preparationTime: number): Promise<string>;
}