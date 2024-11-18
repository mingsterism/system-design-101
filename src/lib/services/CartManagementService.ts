import {
    CartService,
    UserService
} from "../../interfaces";
import { CartItem, MenuItem, CartItemCustomization } from "../../types";
import { calculateItemPrice } from "../utils/calculators";

export class CartManagementService {
    constructor(
        private cartService: CartService,
        private userService: UserService
    ) { }

    async getCurrentUserCart(): Promise<CartItem[]> {
        const currentUser = await this.userService.getCurrentUser();
        if (!currentUser) throw new Error('No user found');
        return this.cartService.getCartItems(currentUser.id);
    }

    async addItem(params: {
        menuItem: MenuItem;
        quantity: number;
        customizations: CartItemCustomization;
        specialInstructions?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            const currentUser = await this.userService.getCurrentUser();
            if (!currentUser) throw new Error('No user found');

            const cartItem: CartItem = {
                id: crypto.randomUUID(),
                menuItemId: params.menuItem.id,
                quantity: params.quantity,
                price: calculateItemPrice(params.menuItem, params.customizations),
                customizations: params.customizations,
                specialInstructions: params.specialInstructions || '',
                addedAt: new Date(),
                updatedAt: new Date()
            };

            await this.cartService.addToCart(cartItem);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add item'
            };
        }
    }

    async updateQuantity(
        itemId: string,
        quantity: number
    ): Promise<{ success: boolean; error?: string }> {
        try {
            await this.cartService.updateCartItem(itemId, { quantity });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update quantity'
            };
        }
    }
}
