import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuPageManager } from '../implementations';
import type {
    MenuItem,
    CartItem,
    GroupOrder,
    User,
    TableSeating
} from '../types';

describe('Menu Page - User Orders Food in Restaurant', () => {
    let menuPageManager: MenuPageManager;
    let menuService;
    let orderService;
    let cartService;
    let tableService;
    let qrCodeService;
    let userService;
    let groupOrderService;

    // Mock Data
    const mockUser: User = {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'customer',
        phoneNumber: null,
        githubId: null,           // Added missing field
        loyaltyPoints: null,      // Changed to nullable
        preferences: null,
        isActive: true,
        lastLogin: null,
        deliveryAddresses: null,  // Added missing field
        createdAt: new Date(),
        updatedAt: null
    };

    const mockTable: TableSeating = {
        id: 'table1',
        number: 12,
        capacity: 4,
        status: 'occupied',
        currentWaiterId: null,
        section: null,
        floorLevel: 1,
        isActive: true,
        lastStatusChange: new Date(),
        qrCode: 'qr123',
        metadata: null
    };

    const mockMenuItem: MenuItem = {
        id: 'menu1',
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomato and mozzarella',
        price: 15.99,
        category: 'Pizza',
        subcategory: null,
        image: null,
        allergens: ['dairy', 'gluten'],
        nutritionalInfo: null,
        preparationTime: 20,
        isAvailable: true,
        isSpecial: false,
        customizationOptions: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const mockCartItem: CartItem = {
        id: 'cart1',
        menuItemId: 'menu1',
        quantity: 1,
        price: 15.99,
        specialInstructions: 'Extra cheese please',
        customizations: {},
        addedAt: new Date(),
        updatedAt: new Date()
    };

    const mockGroupOrder: GroupOrder = {
        id: 'group1',
        mainOrderId: 'order1',
        temporaryGroupId: 'temp123',
        isActive: true,          // Changed to non-null
        createdAt: new Date(),   // Changed to non-null
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    // Setup function to initialize user and table
    const setupUserAndTable = async () => {
        await menuPageManager.initialize();
        await menuPageManager.handleQRCodeScan('qr123');
    };


    beforeEach(() => {
        // Initialize all service mocks
        menuService = {
            getMenuItems: vi.fn().mockResolvedValue([mockMenuItem]),
            getMenuCategories: vi.fn().mockResolvedValue(['Pizza', 'Pasta', 'Drinks']),
            getMenuItemDetails: vi.fn().mockResolvedValue(mockMenuItem),
            checkItemAvailability: vi.fn().mockResolvedValue(true)
        };

        orderService = {
            createOrder: vi.fn().mockResolvedValue({ id: 'order1' }),
            addOrderItem: vi.fn().mockResolvedValue({ id: 'orderItem1' }),
            getActiveOrders: vi.fn().mockResolvedValue([]),
            updateOrderStatus: vi.fn().mockResolvedValue(true)
        };

        cartService = {
            addToCart: vi.fn().mockResolvedValue({ ...mockCartItem, id: 'cart1' }),
            getCartItems: vi.fn().mockResolvedValue([mockCartItem]),
            updateCartItem: vi.fn().mockResolvedValue(mockCartItem),
            removeCartItem: vi.fn().mockResolvedValue(true),
            clearCart: vi.fn().mockResolvedValue(true)
        };

        tableService = {
            getTableByQR: vi.fn().mockResolvedValue(mockTable),
            validateTableStatus: vi.fn().mockResolvedValue(true)
        };

        qrCodeService = {
            validateQRCode: vi.fn().mockResolvedValue(true),
            getTableFromQR: vi.fn().mockResolvedValue(mockTable)
        };

        groupOrderService = {
            createGroupOrder: vi.fn().mockResolvedValue(mockGroupOrder),
            joinGroupOrder: vi.fn().mockResolvedValue(true),
            getGroupOrderItems: vi.fn().mockResolvedValue([mockCartItem])
        };

        userService = {
            getCurrentUser: vi.fn().mockResolvedValue(mockUser),
            getUserPreferences: vi.fn().mockResolvedValue({ allergens: ['nuts'] })
        };

        menuPageManager = new MenuPageManager(
            menuService,
            orderService,
            cartService,
            tableService,
            qrCodeService,
            groupOrderService,
            userService
        );
    });
    describe('1. Initial Page Load and QR Code Scanning', () => {
        it('should validate QR code and associate user with table', async () => {
            const qrCode = 'qr123';
            const result = await menuPageManager.handleQRCodeScan(qrCode);

            expect(qrCodeService.validateQRCode).toHaveBeenCalledWith(qrCode);
            expect(tableService.getTableByQR).toHaveBeenCalledWith(qrCode);
            expect(result.table).toEqual(mockTable);
            expect(result.isValid).toBe(true);
        });

        it('should initialize group order when first user scans QR', async () => {
            await setupUserAndTable();
            await menuPageManager.initializeGroupOrder('qr123');

            expect(groupOrderService.createGroupOrder).toHaveBeenCalledWith({
                userId: mockUser.id,
                tableId: mockTable.id,
                temporaryGroupId: expect.any(String)
            });
        });

        it('should join existing group order for subsequent users', async () => {
            await setupUserAndTable();
            const result = await menuPageManager.joinExistingGroupOrder('group1');

            expect(groupOrderService.joinGroupOrder).toHaveBeenCalledWith('group1', mockUser.id);
            expect(result).toBe(true);
        });
    });

    describe('2. Menu Browsing and Filtering', () => {
        beforeEach(setupUserAndTable);

        it('should load and display menu categories with items', async () => {
            const result = await menuPageManager.loadMenuWithCategories();

            expect(menuService.getMenuCategories).toHaveBeenCalled();
            expect(menuService.getMenuItems).toHaveBeenCalled();
            expect(result.categories).toHaveLength(3);
            expect(result.menuItems).toHaveLength(1);
        });

        it('should filter menu items based on dietary preferences', async () => {
            const preferences = await menuPageManager.applyUserPreferences();

            expect(userService.getUserPreferences).toHaveBeenCalledWith(mockUser.id);
            expect(preferences.allergens).toContain('nuts');
        });
    });

    describe('3. Cart Management and Item Customization', () => {
        beforeEach(setupUserAndTable);

        it('should add item to cart with customizations', async () => {
            const result = await menuPageManager.addItemToCart({
                menuItem: mockMenuItem,
                quantity: 1,
                customizations: {},
                specialInstructions: 'Extra cheese please'
            });

            expect(cartService.addToCart).toHaveBeenCalledWith(expect.objectContaining({
                menuItemId: mockMenuItem.id,
                quantity: 1,
                price: mockMenuItem.price,
                specialInstructions: 'Extra cheese please'
            }));
            expect(result).toEqual(mockCartItem);
        });
    });

    describe('4. Group Order Synchronization', () => {
        beforeEach(async () => {
            await setupUserAndTable();
            await menuPageManager.initializeGroupOrder('qr123');
        });

        it('should display all group members orders in real-time', async () => {
            const orders = await menuPageManager.getGroupOrderItems();
            expect(groupOrderService.getGroupOrderItems).toHaveBeenCalledWith(mockGroupOrder.id);
            expect(orders).toEqual([mockCartItem]);
        });

        it('should distinguish between personal and group orders', async () => {
            const summary = await menuPageManager.getOrderSummary();

            expect(cartService.getCartItems).toHaveBeenCalledWith(mockUser.id);
            expect(groupOrderService.getGroupOrderItems).toHaveBeenCalled();
            expect(summary).toHaveProperty('personalItems');
            expect(summary).toHaveProperty('groupItems');
        });
    });

    describe('5. Order Confirmation Process', () => {
        beforeEach(async () => {
            await setupUserAndTable();
            await menuPageManager.initializeGroupOrder('qr123');
        });

        it('should confirm personal order within group', async () => {
            const result = await menuPageManager.confirmPersonalOrder();

            expect(orderService.createOrder).toHaveBeenCalledWith({
                userId: mockUser.id,
                tableId: mockTable.id,
                groupOrderId: mockGroupOrder.id,
                items: [mockCartItem]
            });
            expect(cartService.clearCart).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });
});
