// tests.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuOrderManager } from '../implementations';
import type { MenuItem, OrderItem, StoredCartItem } from '../types';

describe('MenuOrderManager', () => {
    let menuService;
    let orderService;
    let localStorage;
    let manager: MenuOrderManager;

    const mockMenuItem: MenuItem = {
        id: '1',
        name: 'Pizza',
        price: 10
    };

    const mockOrderItem: OrderItem = {
        id: '1',
        menuItemId: '1',
        quantity: 1,
        price: 10
    };

    beforeEach(() => {
        menuService = {
            getMenuItems: vi.fn().mockResolvedValue([mockMenuItem])
        };

        orderService = {
            addOrderItem: vi.fn().mockResolvedValue(mockOrderItem),
            getOrderItems: vi.fn().mockResolvedValue([mockOrderItem]),
            updateOrderQuantity: vi.fn().mockResolvedValue(mockOrderItem),
            removeOrderItem: vi.fn().mockResolvedValue(undefined)
        };

        localStorage = {
            getStoredCart: vi.fn().mockReturnValue([]),
            addToCart: vi.fn().mockReturnValue([]),
            clearCart: vi.fn()
        };

        manager = new MenuOrderManager(menuService, orderService, localStorage);
    });

    it('should get menu items', async () => {
        const items = await manager.getMenuItems('org1');
        expect(items).toEqual([mockMenuItem]);
        expect(menuService.getMenuItems).toHaveBeenCalledWith({ orgId: 'org1' });
    });

    it('should add item to order', async () => {
        const result = await manager.addItemToOrder({
            orderId: 'order1',
            menuItem: mockMenuItem,
            quantity: 1
        });

        expect(result).toEqual(mockOrderItem);
        expect(orderService.addOrderItem).toHaveBeenCalledWith({
            orderId: 'order1',
            menuItemId: '1'
        });
        expect(localStorage.addToCart).toHaveBeenCalled();
    });

    it('should confirm order and clear cart', async () => {
        localStorage.getStoredCart.mockReturnValue([mockOrderItem]);

        const result = await manager.confirmOrder('order1');

        expect(result).toBe(true);
        expect(localStorage.clearCart).toHaveBeenCalledWith('order1');
    });

    it('should not confirm empty order', async () => {
        localStorage.getStoredCart.mockReturnValue([]);

        const result = await manager.confirmOrder('order1');

        expect(result).toBe(false);
        expect(localStorage.clearCart).not.toHaveBeenCalled();
    });
});