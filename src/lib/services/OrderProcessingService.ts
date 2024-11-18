import {
    OrderService,
    ScheduleService, CartService, UserService
} from "../../interfaces";

import { CartItem, OrderValidation, TimeSlot } from "../../types";

export class OrderProcessingService {
    constructor(
        private orderService: OrderService,
        private scheduleService: ScheduleService,
        private cartService: CartService,
        private userService: UserService
    ) { }

    async validateTakeawayOrder(params: {
        items: CartItem[];
        pickupTime: string;
    }): Promise<OrderValidation> {
        const [orderValidation, timeValidation] = await Promise.all([
            this.orderService.validateOrder({
                type: 'takeaway',
            }),
            this.scheduleService.validatePickupTime(params.pickupTime)
        ]);

        if (!timeValidation) {
            return {
                isValid: false,
                errors: ['Selected pickup time is no longer available']
            };
        }

        return orderValidation;
    }

    async placeOrder(params: {
        items: CartItem[];
        pickupTime: string;
        specialInstructions?: string;
        paymentMethod: string;
    }): Promise<{ orderId: string; error?: string }> {
        try {
            const currentUser = await this.userService.getCurrentUser();
            if (!currentUser) throw new Error('No user found');

            const validation = await this.validateTakeawayOrder({
                items: params.items,
                pickupTime: params.pickupTime
            });

            if (!validation.isValid) {
                throw new Error(validation.errors[0]);
            }

            const order = await this.orderService.createOrder({
                userId: currentUser.id,
                tableId: '',
                items: params.items,
            });

            await this.cartService.clearCart(currentUser.id);
            return { orderId: order.id };
        } catch (error) {
            return {
                orderId: '',
                error: error instanceof Error ? error.message : 'Failed to place order'
            };
        }
    }

    async getOrderConfirmation(orderId: string) {
        return this.orderService.getOrderConfirmation(orderId);
    }

    async getTimeInformation(): Promise<{
        availableSlots: TimeSlot[];
        preparationTime: number;
    }> {
        const currentUser = await this.userService.getCurrentUser();
        if (!currentUser) throw new Error('No user found');

        const cart = await this.cartService.getCartItems(currentUser.id);
        const menuItemIds = cart.map(item => item.menuItemId);

        const [slots, prepTime] = await Promise.all([
            this.scheduleService.getAvailablePickupTimes(),
            this.orderService.getEstimatedPreparationTime(menuItemIds)
        ]);

        return {
            availableSlots: slots,
            preparationTime: prepTime
        };
    }
}
