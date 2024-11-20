import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TakeawayPageManager } from '../TakeawayPageManager';
import type {
    MenuItem,
    Review,
    CartItem,
    User,
    TimeSlot,
    PaymentMethod,
    OrderSummary,
} from '../types';
import { calculateItemPrice } from '../lib/utils/calculators';
import { CartService, MenuService, OrderService, ReviewService, ScheduleService } from '../interfaces';
import { mockMenuItem, mockReviews, mockTimeSlots } from '../lib/utils/mockData';

describe('Takeaway Page - Complete User Journey', () => {
    let takeawayManager: TakeawayPageManager;
    let menuService;
    let reviewService;
    let cartService;
    let orderService;
    let userService;
    let paymentService;
    let scheduleService;

    // Mock Data
       beforeEach(() => {
        menuService = {
            getMenuItems: vi.fn().mockResolvedValue([mockMenuItem]),
            getMenuCategories: vi.fn().mockResolvedValue(['Pizza', 'Pasta', 'Drinks']),
            getMenuItemDetails: vi.fn().mockResolvedValue(mockMenuItem),
            checkItemAvailability: vi.fn().mockResolvedValue(true),
            getPopularItems: vi.fn().mockResolvedValue([mockMenuItem]),
            searchItems: vi.fn().mockResolvedValue([mockMenuItem])
        } as MenuService;

        reviewService = {
            getMenuItemReviews: vi.fn().mockResolvedValue(mockReviews),
            getReviewStats: vi.fn().mockResolvedValue({
                averageRating: 4.5,
                totalReviews: 10
            })
        } as ReviewService;

        cartService = {
            addToCart: vi.fn().mockResolvedValue({ success: true }),
            getCartItems: vi.fn().mockResolvedValue([]),
            updateCartItem: vi.fn().mockResolvedValue({ success: true }),
            removeCartItem: vi.fn().mockResolvedValue(true),
            clearCart: vi.fn().mockResolvedValue(true)
        } as CartService;

        orderService = {
            // Existing mocks
            createOrder: vi.fn().mockResolvedValue({ id: 'order1' }),
            getEstimatedPreparationTime: vi.fn().mockResolvedValue(25),
            validateOrder: vi.fn().mockResolvedValue({
                isValid: true,
                errors: []
            }),
            getOrderConfirmation: vi.fn().mockResolvedValue({
                orderNumber: 'order1',
                pickupTime: '18:00',
                estimatedPreparationTime: 25,
                orderStatus: 'confirmed'
            }),

            // Add missing required methods from interface
            addOrderItem: vi.fn().mockResolvedValue({
                id: 'item1',
                menuItemId: 'pizza1',
                orderId: 'order1',
                quantity: 1,
                status: 'pending'
            }),
            getActiveOrders: vi.fn().mockResolvedValue([]),
            updateOrderStatus: vi.fn().mockResolvedValue(true),
            getOrderItems: vi.fn().mockResolvedValue([]),
            updateOrderQuantity: vi.fn().mockResolvedValue({
                id: 'item1',
                menuItemId: 'pizza1',
                orderId: 'order1',
                quantity: 1,
                status: 'pending'
            }),
            removeOrderItem: vi.fn().mockResolvedValue({
                menuItemId: 'pizza1',
                orderId: 'order1',
                blabla: 'name'
            })
        } as OrderService;


        scheduleService = {
            getAvailablePickupTimes: vi.fn().mockResolvedValue(mockTimeSlots),
            validatePickupTime: vi.fn().mockResolvedValue(true),
            getEstimatedPickupTime: vi.fn().mockResolvedValue(25)
        } as ScheduleService;

        takeawayManager = new TakeawayPageManager(
            menuService,
            reviewService,
            cartService,
            orderService,
            userService,
            paymentService,
            scheduleService
        );
    });

    describe('1. Initial Page Load and Menu Display', () => {
        it('should load menu categories and popular items on initial render', async () => {
            // When a user first lands on the takeaway page, they see categories and popular items
            const { categories, popularItems } = await takeawayManager.initializePage();

            expect(menuService.getMenuCategories).toHaveBeenCalled();
            expect(menuService.getPopularItems).toHaveBeenCalled();
            expect(categories).toHaveLength(3);
            expect(popularItems).toHaveLength(1);
        });

        it('should handle menu category filtering', async () => {
            // When user clicks on a category tab
            const items = await takeawayManager.filterByCategory('Pizza');

            expect(menuService.getMenuItems).toHaveBeenCalledWith({
                category: 'Pizza',
                filters: expect.any(Object)
            });
            expect(items).toHaveLength(1);
        });

        it('should handle menu search with live suggestions', async () => {
            // As user types in the search box, suggestions appear
            const suggestions = await takeawayManager.searchWithSuggestions('pep');

            expect(menuService.searchItems).toHaveBeenCalledWith('pep');
            expect(suggestions).toContainEqual(expect.objectContaining({
                name: expect.stringContaining('Pepperoni')
            }));
        });
    });

    describe('2. Menu Item Detail Interaction', () => {
        it('should load detailed item information when item is clicked', async () => {
            // When user clicks on a menu item, detailed view opens in sidebar
            const details = await takeawayManager.getItemDetails('pizza1');

            expect(menuService.getMenuItemDetails).toHaveBeenCalledWith('pizza1');
            expect(details).toEqual(mockMenuItem);
        });

        it('should load item reviews and ratings', async () => {
            // When user scrolls to reviews section in item detail
            const { reviews, stats } = await takeawayManager.getItemReviews('pizza1');

            expect(reviewService.getMenuItemReviews).toHaveBeenCalledWith('pizza1');
            expect(reviewService.getReviewStats).toHaveBeenCalledWith('pizza1');
            expect(reviews).toEqual(mockReviews);
            expect(stats).toHaveProperty('averageRating');
            expect(stats).toHaveProperty('totalReviews');
        });

        it('should calculate customization prices correctly', async () => {
            // When user selects different options and customizations
            const price = calculateItemPrice(
                mockMenuItem,
                {
                    size: ['large'],
                    extra: ['cheese', 'pepperoni']
                })
            // Base: 18.99, Large: +4, Extra Cheese: +2, Extra Pepperoni: +2.5
            expect(price).toBe(27.49);
        });
    });

    describe('3. Cart Management', () => {
        it('should add customized item to cart', async () => {
            // When user customizes item and clicks "Add to Cart"
            const result = await takeawayManager.addToCart({
                menuItem: mockMenuItem,
                quantity: 1,
                customizations: {
                    size: ['large'],
                    extra: ['cheese']
                },
                specialInstructions: 'Well done please'
            });

            expect(cartService.addToCart).toHaveBeenCalledWith(expect.objectContaining({
                menuItemId: 'pizza1',
                customizations: expect.any(Object),
                specialInstructions: 'Well done please'
            }));
            expect(result.success).toBe(true);
        });

        it('should update cart quantities', async () => {
            // When user adjusts quantity in cart
            const result = await takeawayManager.updateCartItemQuantity('cartItem1', 3);

            expect(cartService.updateQuantity).toHaveBeenCalledWith('cartItem1', 3);
            expect(result.success).toBe(true);
        });

        it('should calculate cart totals with promotions', async () => {
            // When cart is updated, totals are recalculated
            const summary = await takeawayManager.getCartSummary();

            expect(summary).toHaveProperty('subtotal');
            expect(summary).toHaveProperty('tax');
            expect(summary).toHaveProperty('total');
            expect(summary).toHaveProperty('appliedDiscounts');
        });
    });

    describe('4. Takeaway Time Selection', () => {
        it('should load available pickup time slots', async () => {
            // When user proceeds to select pickup time
            const slots = await takeawayManager.getAvailablePickupTimes();

            expect(scheduleService.getAvailablePickupTimes).toHaveBeenCalled();
            expect(slots).toEqual(mockTimeSlots);
        });

        it('should calculate estimated preparation time', async () => {
            // When viewing time slots, system shows preparation time
            const time = await takeawayManager.getEstimatedPreparationTime();

            expect(orderService.getEstimatedPreparationTime).toHaveBeenCalledWith(['pizza1']);
            expect(time).toBe(25); // minutes
        });

        it('should validate selected pickup time', async () => {
            // When user selects a pickup time
            const isValid = await takeawayManager.validatePickupTime('18:00');

            expect(scheduleService.validatePickupTime).toHaveBeenCalledWith('18:00');
            expect(isValid).toBe(true);
        });
    });

    describe('5. Order Placement', () => {
        it('should validate order before placement', async () => {
            // When user attempts to place order
            const validation = await takeawayManager.validateTakeawayOrder({
                items: [{ menuItemId: 'pizza1', quantity: 1, customizations: { size: ['large'], extra: ['cheese'] }, specialInstructions: 'Call upon arrival', id: '', price: 0, updatedAt: null, addedAt: null }],
                pickupTime: '18:00'
            });

            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
        });

        it('should place takeaway order with all details', async () => {
            // When user confirms order placement
            const result = await takeawayManager.placeTakeawayOrder({
                items: [{ menuItemId: 'pizza1', quantity: 1, customizations: { size: ['large'], extra: ['cheese'] }, specialInstructions: 'Call upon arrival', id: '', price: 0, updatedAt: null, addedAt: null }],
                pickupTime: '18:00',
                specialInstructions: 'Call upon arrival',
                paymentMethod: 'credit_card'
            });

            expect(orderService.createTakeawayOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    pickupTime: '18:00',
                    specialInstructions: 'Call upon arrival'
                })
            );
            expect(result).toHaveProperty('orderId');
        });

        it('should handle order confirmation and notifications', async () => {
            // After order is placed successfully
            const confirmationDetails = await takeawayManager.getOrderConfirmation('order1');

            expect(confirmationDetails).toHaveProperty('orderNumber');
            expect(confirmationDetails).toHaveProperty('pickupTime');
            expect(confirmationDetails).toHaveProperty('estimatedPreparationTime');
            expect(confirmationDetails).toHaveProperty('orderStatus');
        });
    });
});