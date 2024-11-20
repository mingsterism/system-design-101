export interface StateRepositoryQueries {
    getOrders(orderIds: string[]): OrderState[];
    getOrderItems(itemIds: string[]): OrderItem[];
    getMenuItems(itemIds: string[]): MenuItem[];
    getTables(tableIds: string[]): TableStatus[];
}

export interface StateRepositoryCommands {
    updateOrders(orders: OrderState[]): void;
    updateOrderItems(items: OrderItem[])
    updateMenuItems(items: MenuItem[])
    updateTables(tables: TableStatus[])
    createOrders(orders: OrderState[]): void;
    createOrderItems(items: OrderItem[])
    createMenuItems(items: MenuItem[])
    createTables(tables: TableStatus[])
    deleteOrders(orderIds: string[]): void;
    deleteOrderItems(itemIds: string[])
    deleteMenuItems(itemIds: string[])
    deleteTables(tableIds: string[])
}


// Types
type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'prepared' | 'served' | 'completed' | 'cancelled';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// ---------------
// Query Interfaces
// ---------------

interface OrderQueries {
    getOrdersByStatus(status: OrderStatus): Promise<Result<OrderState[]>>;
    getOrderById(orderId: string): Promise<Result<OrderState>>;
    getOrderItemsByStatus(status: OrderStatus): Promise<Result<OrderItem[]>>;
    getOrderItemById(itemId: string): Promise<Result<OrderItem>>;
}

interface MenuQueries {
    getMenuItems(category?: string): Promise<Result<MenuItem[]>>;
    getMenuItemById(itemId: string): Promise<Result<MenuItem>>;
    getPopularItems(): Promise<Result<MenuItem[]>>;
    getAvailableItems(): Promise<Result<MenuItem[]>>;
}

interface TableQueries {
    getTableStatus(tableId: string): Promise<Result<TableStatus>>;
    getAvailableTables(): Promise<Result<TableStatus[]>>;
    getTableOrders(tableId: string): Promise<Result<OrderState[]>>;
}

interface PaymentQueries {
    getPaymentStatus(orderId: string): Promise<Result<PaymentStatus>>;
    getPaymentHistory(orderId: string): Promise<Result<Payment[]>>;
    getBillDetails(orderId: string): Promise<Result<Bill>>;
}

interface AnalyticsQueries {
    getRevenueReport(dateRange: DateRange): Promise<Result<RevenueReport>>;
    getOrderAnalytics(dateRange: DateRange): Promise<Result<OrderAnalytics>>;
    getPopularItemsReport(dateRange: DateRange): Promise<Result<PopularItemsReport>>;
    getStaffPerformance(dateRange: DateRange): Promise<Result<StaffPerformance[]>>;
}

// ---------------
// Command (Mutation) Interfaces
// ---------------

interface KitchenCommands {
    startPreparation(itemId: string, cookId: string): Promise<Result<void>>;
    markPrepared(itemId: string, cookId: string): Promise<Result<void>>;
    addPreparationNote(itemId: string, note: string, cookId: string): Promise<Result<void>>;
    cancelPreparation(itemId: string, reason: string, cookId: string): Promise<Result<void>>;
}

interface WaiterCommands {
    generateTableQr(tableId: string, waiterId: string): Promise<Result<void>>;
    assignTable(tableId: string, customerId: string, waiterId: string): Promise<Result<void>>;
    markServed(itemId: string, waiterId: string): Promise<Result<void>>;
    processPayment(orderId: string, paymentDetails: PaymentDetails, waiterId: string): Promise<Result<void>>;
}

export interface CustomerCommands {
    createOrder(tableId: string, customerId: string): Promise<Result<void>>;
    addOrderItem(orderId: string, item: OrderItemRequest): Promise<Result<void>>;
    modifyOrderItem(itemId: string, modifications: OrderItemModification): Promise<Result<void>>;
    confirmOrder(orderId: string): Promise<Result<void>>;
    requestBill(orderId: string): Promise<Result<void>>;
    makePayment(orderId: string, paymentDetails: PaymentDetails): Promise<Result<void>>;
}

interface AdminCommands {
    manageMenuItem(item: MenuItem, action: 'create' | 'update' | 'delete'): Promise<Result<void>>;
    manageStaffAccess(userId: string, role: StaffRole, action: 'grant' | 'revoke'): Promise<Result<void>>;
    manageTable(tableId: string, action: 'add' | 'remove' | 'update', details: TableDetails): Promise<Result<void>>;
    overrideOrderStatus(orderId: string, newStatus: OrderStatus, reason: string): Promise<Result<void>>;
}

// ---------------
// Supporting Types
// ---------------

interface OrderState {
    orderId: string;
    tableId: string;
    status: OrderStatus;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
    customerId: string;
}

interface OrderItemRequest {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    customizations?: string[];
}

interface OrderItemModification {
    quantity?: number;
    specialInstructions?: string;
    customizations?: string[];
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface TableDetails {
    capacity: number;
    location: string;
    status: 'active' | 'inactive' | 'maintenance';
}

// ---------------
// Module Interface Combinations
// ---------------

export interface CustomerModule extends
    OrderQueries,
    MenuQueries,
    PaymentQueries,
    CustomerCommands {}

interface WaiterModule extends
    OrderQueries,
    TableQueries,
    PaymentQueries,
    WaiterCommands {}

interface KitchenModule extends
    OrderQueries,
    MenuQueries,
    KitchenCommands {}

interface AdminModule extends
    OrderQueries,
    MenuQueries,
    TableQueries,
    PaymentQueries,
    AnalyticsQueries,
    AdminCommands {}


