import * as schema from "./lib/db/schema"
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export type OrderStatus = (typeof schema.orderStatusEnum.enumValues)[number];
export type OrderType = (typeof schema.orderTypeEnum.enumValues)[number];
export type PaymentStatus = (typeof schema.paymentStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof schema.paymentMethodEnum.enumValues)[number];
export type TableStatus = (typeof schema.tableStatusEnum.enumValues)[number];
export type ReservationStatus = (typeof schema.reservationStatusEnum.enumValues)[number];
export type Role = (typeof schema.roleEnum.enumValues)[number];

// Model type exports
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;
export type Session = InferSelectModel<typeof schema.sessions>;
export type NewSession = InferInsertModel<typeof schema.sessions>;
export type MenuItem = InferSelectModel<typeof schema.menuItems>;
export type NewMenuItem = InferInsertModel<typeof schema.menuItems>;
export type TableSeating = InferSelectModel<typeof schema.tableSeating>;
export type NewTableSeating = InferInsertModel<typeof schema.tableSeating>;
export type Order = InferSelectModel<typeof schema.orders>;
export type NewOrder = InferInsertModel<typeof schema.orders>;
export type OrderItem = InferSelectModel<typeof schema.orderItems>;
export type NewOrderItem = InferInsertModel<typeof schema.orderItems>;
export type GroupOrder = InferSelectModel<typeof schema.groupOrders>;
export type NewGroupOrder = InferInsertModel<typeof schema.groupOrders>;
export type Payment = InferSelectModel<typeof schema.payments>;
export type NewPayment = InferInsertModel<typeof schema.payments>;
export type SplitPayment = InferSelectModel<typeof schema.splitPayments>;
export type NewSplitPayment = InferInsertModel<typeof schema.splitPayments>;
export type Review = InferSelectModel<typeof schema.reviews>;
export type NewReview = InferInsertModel<typeof schema.reviews>;
export type Inventory = InferSelectModel<typeof schema.inventory>;
export type NewInventory = InferInsertModel<typeof schema.inventory>;
export type InventoryTransaction = InferSelectModel<typeof schema.inventoryTransactions>;
export type NewInventoryTransaction = InferInsertModel<typeof schema.inventoryTransactions>;
export type Shift = InferSelectModel<typeof schema.shifts>;
export type NewShift = InferInsertModel<typeof schema.shifts>;
export type CartItem = InferSelectModel<typeof schema.cartItems>;
export type NewCartItem = InferInsertModel<typeof schema.cartItems>;


// Additional type exports
export type Reservation = InferSelectModel<typeof schema.reservations>;
export type NewReservation = InferInsertModel<typeof schema.reservations>;
export type Waitlist = InferSelectModel<typeof schema.waitlist>;
export type NewWaitlist = InferInsertModel<typeof schema.waitlist>;
export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;
export type Promotion = InferSelectModel<typeof schema.promotions>;
export type NewPromotion = InferInsertModel<typeof schema.promotions>;
export type PromotionUsage = InferSelectModel<typeof schema.promotionUsage>;
export type NewPromotionUsage = InferInsertModel<typeof schema.promotionUsage>;
export type KdsStation = InferSelectModel<typeof schema.kdsStations>;
export type NewKdsStation = InferInsertModel<typeof schema.kdsStations>;
export type KdsOrderRouting = InferSelectModel<typeof schema.kdsOrderRouting>;
export type NewKdsOrderRouting = InferInsertModel<typeof schema.kdsOrderRouting>;
export type SystemSetting = InferSelectModel<typeof schema.systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof schema.systemSettings>;
export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLogs>;


// For localStorage persistence
export interface StoredCartItem extends CartItem {
    name: string;  // Include menu item name for display purposes
    customizations: CartItemCustomization;
}

export interface CartItemCustomization {
    [optionId: string]: string[];
}

export interface OrderSummary {
    personalItems: CartItem[];
    groupItems: CartItem[];
    totalAmount: number;
    groupTotalAmount: number;
    appliedDiscounts?: PromotionUsage[];
    tax: number;
    serviceCharge?: number;
}

// Time Slot Management
export interface TimeSlot {
    id: string;
    time: string;
    isAvailable: boolean;
    maxOrders?: number;
    currentOrders?: number;
}

// Review & Rating
export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}

// Order Management
export interface OrderValidation {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export interface TakeawayOrderRequest {
    items: CartItem[];
    pickupTime: string;
    specialInstructions?: string;
    paymentMethod: PaymentMethod;
}

export interface OrderConfirmation {
    orderId: string;
    orderNumber: string;
    type: OrderType;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    items: OrderItem[];
    totalAmount: number;
    pickupTime?: string;
    tableNumber?: number;
    estimatedPreparationTime: number;
    specialInstructions?: string;
}

// Preparation Time
export interface PreparationTimeEstimate {
    totalTime: number;
    itemBreakdown: {
        menuItemId: string;
        name: string;
        preparationTime: number;
    }[];
    rushHourAdjustment?: number;
}

// Menu Customization
export interface CustomizationValidation {
    isValid: boolean;
    errors: string[];
    priceAdjustment: number;
}

// Page State Management
export interface MenuPageState {
    currentCategory?: string;
    searchTerm?: string;
    filters: {
        dietary?: string[];
        allergens?: string[];
        priceRange?: [number, number];
        availability?: boolean;
    };
    sortBy?: 'price' | 'name' | 'popularity';
    cartVisible: boolean;
    selectedItem?: MenuItem;
    loading: boolean;
    error?: string;
}

export interface OrderPageState {
    type: OrderType;
    step: 'menu' | 'cart' | 'details' | 'payment' | 'confirmation';
    selectedTimeSlot?: TimeSlot;
    paymentMethod?: PaymentMethod;
    specialInstructions?: string;
    loading: boolean;
    error?: string;
}

// Error Handling
export interface ApiError extends Error {
    code: string;
    details?: Record<string, any>;
    httpStatus?: number;
}

// Service Responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    metadata?: Record<string, any>;
}


export interface OrderSummary {
    personalItems: CartItem[];
    groupItems: CartItem[];
    totalAmount: number;
    groupTotalAmount: number;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}