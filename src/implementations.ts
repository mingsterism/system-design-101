import {
    LocalStorageService, MenuService, OrderService,
    CartService, TableService, QRCodeService, GroupOrderService, UserService, ScheduleService, ReviewService
} from './interfaces';
import type {
    OrderType,
    OrderValidation,
    Review, ReviewStats,
    CartItemCustomization, TimeSlot, OrderConfirmation,
    MenuItem,
    OrderItem,
    CartItem,
    GroupOrder,
    StoredCartItem,
    User,
    TableSeating,
    OrderSummary,
    ValidationResult
} from "./types";
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


    async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
        return this.menuService.getMenuItems({
            search: undefined,
            filters: { restaurantId }
        });
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

        const storedItem: StoredCartItem = {
            id: crypto.randomUUID(),
            updatedAt: new Date(),
            addedAt: new Date(),
            menuItemId: params.menuItem.id,
            name: params.menuItem.name,
            price: params.menuItem.price,
            quantity: params.quantity,
            customizations: {},
            specialInstructions: null
        };

        this.localStorage.addToCart(params.orderId, storedItem);


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

export class MenuPageManager {
    private currentUser?: User;
    private currentTable?: TableSeating;
    private groupOrder?: GroupOrder;
    private orderType: OrderType = 'dine_in';
    private menuItems: MenuItem[] = [];

    constructor(
        private menuService: MenuService,
        private reviewService: ReviewService,

        private orderService: OrderService,
        private cartService: CartService,
        private tableService: TableService,
        private qrCodeService: QRCodeService,
        private groupOrderService: GroupOrderService,
        private userService: UserService,
        private scheduleService: ScheduleService

    ) { }

    // 1. Initial Page Load and QR Code Handling
    async initialize(orderType: OrderType = 'dine_in'): Promise<void> {
        this.orderType = orderType;
        this.currentUser = await this.userService.getCurrentUser();

        // Only initialize table and group order for dine-in
        if (orderType === 'dine_in') {
            this.currentTable = undefined;
            this.groupOrder = undefined;
        }
    }



    async handleQRCodeScan(qrCode: string): Promise<{
        isValid: boolean;
        table?: TableSeating;
        error?: string
    }> {
        try {
            const isValid = await this.qrCodeService.validateQRCode(qrCode);
            if (!isValid) {
                return { isValid: false, error: 'Invalid QR code' };
            }

            const table = await this.tableService.getTableByQR(qrCode);
            const tableValid = await this.tableService.validateTableStatus(table.id);

            if (!tableValid) {
                return { isValid: false, error: 'Table is not available' };
            }

            this.currentTable = table;
            return { isValid: true, table };
        } catch (error) {
            return { isValid: false, error: 'Error processing QR code' };
        }
    }

    async initializeGroupOrder(qrCode: string): Promise<GroupOrder> {
        if (!this.currentUser || !this.currentTable) {
            throw new Error('User or table not initialized');
        }

        const groupOrder = await this.groupOrderService.createGroupOrder({
            tableId: this.currentTable.id,
            userId: this.currentUser.id
        });

        this.groupOrder = groupOrder;
        return groupOrder;
    }

    async joinExistingGroupOrder(groupId: string): Promise<boolean> {
        if (!this.currentUser) {
            throw new Error('User not initialized');
        }

        const success = await this.groupOrderService.joinGroupOrder(
            groupId,
            this.currentUser.id
        );

        if (success) {
            this.groupOrder = { id: groupId } as GroupOrder;
        }

        return success;
    }

    // 2. Menu Management
    async loadMenuWithCategories(): Promise<{
        categories: string[];
        menuItems: MenuItem[];
    }> {
        const [categories, menuItems] = await Promise.all([
            this.menuService.getMenuCategories(),
            this.menuService.getMenuItems({})
        ]);

        this.menuItems = menuItems;

        return { categories, menuItems };
    }

    async applyUserPreferences(): Promise<any> {
        if (!this.currentUser) {
            throw new Error('User not initialized');
        }

        const preferences = await this.userService.getUserPreferences(this.currentUser.id);
        return this.filterMenuByPreferences(preferences);
    }

    async searchMenuItems(searchTerm: string, filters: any): Promise<MenuItem[]> {
        const filteredItems = await this.menuService.getMenuItems({
            search: searchTerm,
            filters
        });

        this.menuItems = filteredItems;
        return filteredItems;
    }

    // 3. Cart Management
    async addItemToCart(params: {
        menuItem: MenuItem;
        quantity: number;
        customizations?: any;
        specialInstructions: string;
    }): Promise<CartItem> {
        if (!this.currentUser) {
            throw new Error('User not initialized');
        }

        const cartItem: CartItem = {
            id: crypto.randomUUID(),
            addedAt: new Date(),
            updatedAt: new Date(),
            menuItemId: params.menuItem.id,
            quantity: params.quantity,
            price: params.menuItem.price,
            customizations: params.customizations,
            specialInstructions: params.specialInstructions
        };

        return this.cartService.addToCart(cartItem);
    }

    async validateAndAddToCart(menuItemId: string): Promise<boolean> {
        const isAvailable = await this.menuService.checkItemAvailability(menuItemId);
        if (!isAvailable) {
            throw new Error('Item is not available');
        }

        const menuItem = await this.menuService.getMenuItemDetails(menuItemId);
        await this.addItemToCart({
            menuItem,
            quantity: 1,
            specialInstructions: ""
        });
        return true;
    }

    async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
        return this.cartService.updateCartItem(cartItemId, { quantity });
    }

    // 4. Group Order Management
    async getGroupOrderItems(): Promise<CartItem[]> {
        if (!this.groupOrder) {
            throw new Error('No active group order');
        }

        return this.groupOrderService.getGroupOrderItems(this.groupOrder.id);
    }

    async getOrderSummary(): Promise<OrderSummary> {
        if (!this.currentUser || !this.groupOrder) {
            throw new Error('User or group order not initialized');
        }

        const [personalItems, groupItems] = await Promise.all([
            this.cartService.getCartItems(this.currentUser.id),
            this.groupOrderService.getGroupOrderItems(this.groupOrder.id)
        ]);

        const personalTotal = this.calculateTotal(personalItems);
        const groupTotal = this.calculateTotal(groupItems);
        const tax = 0; // Add appropriate tax calculation here

        return {
            personalItems,
            groupItems,
            totalAmount: personalTotal,
            groupTotalAmount: groupTotal,
            tax,
            subtotal: personalTotal + groupTotal,
            total: personalTotal + groupTotal + tax
        };
    }

    async getItemDetails(menuItemId: string): Promise<{
        details: MenuItem;
        reviews: Review[];
        stats: ReviewStats;
    }> {
        const [details, reviews, stats] = await Promise.all([
            this.menuService.getMenuItemDetails(menuItemId),
            this.reviewService.getMenuItemReviews(menuItemId),
            this.reviewService.getReviewStats(menuItemId)
        ]);

        return { details, reviews, stats };
    }

    calculateItemPrice(params: {
        baseItem: MenuItem;
        customizations: CartItemCustomization;
    }): number {
        let total = params.baseItem.price;

        // Calculate customization prices
        if (Array.isArray(params.baseItem.customizationOptions)) {
            for (const option of params.baseItem.customizationOptions) {
                const selections = params.customizations[option.id] || [];
                for (const selection of selections) {
                    const optionPrice = option.options.find(opt => opt.id === selection)?.price || 0;
                    total += optionPrice;
                }
            }
        }

        return total;
    }

    async validateOrder(params: {
        items: CartItem[];
        pickupTime?: string;
    }): Promise<OrderValidation> {
        const validation = await this.orderService.validateOrder({
            type: this.orderType,
        });

        // Additional validation based on order type
        if (this.orderType === 'takeaway' && !params.pickupTime) {
            return {
                isValid: false,
                errors: ['Pickup time is required for takeaway orders']
            };
        }

        return validation;
    }

    // 5. Order Confirmation
    async validateOrderItems(items: CartItem[]): Promise<ValidationResult> {
        try {
            const availabilityChecks = await Promise.all(
                items.map(item => this.menuService.checkItemAvailability(item.menuItemId))
            );

            const isValid = availabilityChecks.every(available => available);
            return {
                isValid,
                errors: isValid ? [] : ['Some items are no longer available']
            };
        } catch (error) {
            return {
                isValid: false,
                errors: ['Error validating order items']
            };
        }
    }

    async confirmPersonalOrder(): Promise<{
        success: boolean;
        orderId?: string;
        error?: string
    }> {
        if (!this.currentUser || !this.currentTable) {
            return { success: false, error: 'Missing user or table information' };
        }

        try {
            const cartItems = await this.cartService.getCartItems(this.currentUser.id);
            const validation = await this.validateOrderItems(cartItems);

            if (!validation.isValid) {
                return { success: false, error: validation.errors[0] };
            }

            const order = await this.orderService.createOrder({
                userId: this.currentUser.id,
                tableId: this.currentTable.id,
                groupOrderId: this.groupOrder?.id,
                items: cartItems
            });

            await this.cartService.clearCart(this.currentUser.id);
            return { success: true, orderId: order.id };
        } catch (error) {
            return { success: false, error: 'Error confirming order' };
        }
    }

    async confirmOrderWithCustomizations(items: CartItem[]): Promise<boolean> {
        if (!this.currentUser || !this.currentTable) {
            throw new Error('Missing user or table information');
        }

        const order = await this.orderService.createOrder({
            userId: this.currentUser.id,
            tableId: this.currentTable.id,
            groupOrderId: this.groupOrder?.id,
            items
        });

        return !!order.id;
    }

    // Takeaway specific methods
    async getAvailablePickupTimes(): Promise<TimeSlot[]> {
        if (this.orderType !== 'takeaway') {
            throw new Error('Operation only available for takeaway orders');
        }
        return this.scheduleService.getAvailablePickupTimes();
    }

    async getEstimatedPreparationTime(menuItemIds: string[]): Promise<number> {
        return this.orderService.getEstimatedPreparationTime(menuItemIds);
    }

    async validatePickupTime(time: string): Promise<boolean> {
        return this.scheduleService.validatePickupTime(time);
    }

    async getOrderConfirmation(orderId: string): Promise<OrderConfirmation> {
        return this.orderService.getOrderConfirmation(orderId);
    }


    // Helper Methods
    private calculateTotal(items: CartItem[]): number {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    private filterMenuByPreferences(preferences: any): MenuItem[] {
        return this.menuItems.filter(item => {
            // Implement preference-based filtering logic
            if (preferences.allergens && Array.isArray(preferences.allergens)) {
                return this.menuItems.filter(item => {
                    if (item.allergens && Array.isArray(item.allergens)) {
                        return !item.allergens.some(
                            allergen => preferences.allergens.includes(allergen)
                        );
                    }
                    return true;
                });
            }
            return true;
        });
    }
}

