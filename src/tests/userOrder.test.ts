import {describe, it, expect, beforeEach, vi} from "vitest";
import {TakeawayPageManager} from "../TakeawayPageManager";
import type {
    MenuItem,
    Review,
    CartItem,
    User,
    TimeSlot,
    PaymentMethod,
    OrderSummary,
} from "../types";
import {calculateItemPrice} from "../lib/utils/calculators";
import {
    CartService,
    MenuService,
    OrderService,
    ReviewService,
    ScheduleService,
} from "../interfaces";
import {mockMenuItem, mockReviews, mockTimeSlots} from '../lib/utils/mockData';

interface UtilFunctions {
    generateQrCode (val:string): string;
}

class MockUtilFunctions implements UtilFunctions {
    generateQrCode (val: string): string {
        return 'mockQrCode'
    }
}

class WaiterService implements UtilFunctions {
    private utilFunctions: UtilFunctions
    constructor (utilFunctions: UtilFunctions) {
        this.utilFunctions = utilFunctions
    }
    generateQrCode(tableId: string): string {
        return this.utilFunctions.generateQrCode(tableId)
    }
}

describe('user Journey when ordering food from a client perspective', () => {
    let waiterService: WaiterService
    let mockUtilFunctions: UtilFunctions

    beforeEach( () =>{
        mockUtilFunctions = new MockUtilFunctions()
        waiterService = new WaiterService(mockUtilFunctions)
    })
    it('the waiter generates the QR code for a particular table', () => {
        //   waiter generates the QR code for a particular table
        const qrCode = waiterService.generateQrCode('table1')
    })
    it('the user scans the QR code that is given to them by the waiter', () => {

    })
    it('the user sees the list of menu items', () => {
    })
    it('the user selects one of the menu items on the list', () => {
    })
    it('the user goes to checkout to view the list of items in their cart', () => {
    })
    it('the user clicks the confirm order and the menu items moves to status confirm', () => {
    })
})


















