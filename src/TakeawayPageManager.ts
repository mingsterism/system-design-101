import { MenuQueryService, CartManagementService, OrderProcessingService } from "./lib/services";
import {
    MenuService,
    ReviewService,
    CartService,
    OrderService,
    UserService,
    ScheduleService
} from "./interfaces";

import {
    OrderSummary,
    MenuItem,
    CartItemCustomization,
    CartItem,
} from "./types";

import { calculateOrderTotals, calculateItemPrice } from "./lib/utils/calculators";

export class TakeawayPageManager {
    private menuQuery: MenuQueryService;
    private cartManager: CartManagementService;
    private orderProcessor: OrderProcessingService;
    private reviewService: ReviewService;

    constructor(
        menuService: MenuService,
        reviewService: ReviewService,
        cartService: CartService,
        orderService: OrderService,
        userService: UserService,
        paymentService: any,
        scheduleService: ScheduleService
    ) {
        this.menuQuery = new MenuQueryService(menuService);
        this.cartManager = new CartManagementService(cartService, userService);
        this.orderProcessor = new OrderProcessingService(
            orderService,
            scheduleService,
            cartService,
            userService
        );
        this.reviewService = reviewService;
    }

    // Initial page load
    async initializePage() {
        return this.menuQuery.getInitialPageData();
    }

    // Menu interactions
    async filterByCategory(category: string) {
        return this.menuQuery.getFilteredItems(category);
    }

    async searchWithSuggestions(searchTerm: string) {
        return this.menuQuery.getFilteredItems(undefined, searchTerm);
    }

    async getItemDetails(menuItemId: string) {
        return this.menuQuery.getItemWithDetails(menuItemId);
    }

    async getItemReviews(itemId: string) {
        const reviews = await this.reviewService.getMenuItemReviews(itemId);
        const stats = await this.reviewService.getReviewStats(itemId);
        return { reviews, stats };
    }

    // Cart management
    calculateItemPrice(baseItem: MenuItem, customizations: CartItemCustomization) {
        return calculateItemPrice(baseItem, customizations);
    }

    async addToCart(params: {
        menuItem: MenuItem;
        quantity: number;
        customizations: CartItemCustomization;
        specialInstructions?: string;
    }) {
        return this.cartManager.addItem(params);
    }

    async updateCartItemQuantity(itemId: string, quantity: number) {
        return this.cartManager.updateQuantity(itemId, quantity);
    }

    async getCartSummary(): Promise<OrderSummary> {
        const items = await this.cartManager.getCurrentUserCart();
        const { subtotal, tax, total } = calculateOrderTotals(items);

        return {
            subtotal,
            tax,
            total,
            appliedDiscounts: [],
            personalItems: items,
            groupItems: [], // No group items in takeaway
            totalAmount: total,
            groupTotalAmount: 0 // No group total in takeaway
        };
    }

    // Order processing
    async getAvailablePickupTimes() {
        const { availableSlots } = await this.orderProcessor.getTimeInformation();
        return availableSlots;
    }

    async getEstimatedPreparationTime() {
        const { preparationTime } = await this.orderProcessor.getTimeInformation();
        return preparationTime;
    }

    validatePickupTime(time: string) {
        return this.orderProcessor.validateTakeawayOrder({
            items: [],  // Validation focuses on time only
            pickupTime: time
        });
    }

    async validateTakeawayOrder(params: {
        items: CartItem[];
        pickupTime: string;
    }) {
        return this.orderProcessor.validateTakeawayOrder(params);
    }

    async placeTakeawayOrder(params: {
        items: CartItem[];
        pickupTime: string;
        specialInstructions?: string;
        paymentMethod: string;
    }) {
        return this.orderProcessor.placeOrder(params);
    }

    async getOrderConfirmation(orderId: string) {
        return this.orderProcessor.getOrderConfirmation(orderId);
    }
}
