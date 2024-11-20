import {EventEmitter} from 'events';

// Value Objects and Types
type OrderStatus =
    'new'
    | 'confirmed'
    | 'preparing'
    | 'prepared'
    | 'served'
    | 'cancelled';
type Result<T> = { success: true; data: T } | { success: false; error: string };

interface OrderItem {
    readonly id: string;
    readonly menuItemId: string;
    readonly quantity: number;
    readonly price: number;
    readonly status: OrderStatus;
    readonly customizations: ReadonlyArray<string>;
    readonly specialInstructions: string | null;
    readonly orderId: string;
    readonly preparedBy: string | null;
    readonly servedBy: string | null;
    readonly preparedAt: Date | null;
    readonly servedAt: Date | null;
}

interface OrderState {
    readonly orderId: string;
    readonly tableId: string | null;
    readonly customerId: string;
    readonly items: ReadonlyArray<OrderItem>;
    readonly status: OrderStatus;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

// Pure Functions for Order Operations
const OrderOperations = {
    addItem(state: OrderState, item: Omit<OrderItem, 'orderId'>): Result<OrderState> {
        if (state.status !== 'new') {
            return {
                success: false,
                error: 'Can only add items to new orders'
            };
        }

        const newItem: OrderItem = {
            ...item,
            orderId: state.orderId
        };

        return {
            success: true,
            data: {
                ...state,
                items: [...state.items, newItem],
                updatedAt: new Date()
            }
        };
    },

    confirm(state: OrderState): Result<OrderState> {
        if (state.status !== 'new') {
            return {
                success: false,
                error: 'Can only confirm new orders'
            };
        }

        if (state.items.length === 0) {
            return {
                success: false,
                error: 'Cannot confirm empty order'
            };
        }

        return {
            success: true,
            data: {
                ...state,
                status: 'confirmed',
                updatedAt: new Date()
            }
        };
    },

    updateItemStatus(
        state: OrderState,
        itemId: string,
        newStatus: OrderStatus,
        userId: string
    ): Result<OrderState> {
        const itemIndex = state.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return {
                success: false,
                error: 'Item not found'
            };
        }

        const item = state.items[itemIndex];
        const validTransition = isValidStatusTransition(item.status, newStatus);
        if (!validTransition) {
            return {
                success: false,
                error: `Invalid status transition from ${item.status} to ${newStatus}`
            };
        }

        const updatedItem: OrderItem = {
            ...item,
            status: newStatus,
            ...(newStatus === 'prepared' && {
                preparedBy: userId,
                preparedAt: new Date()
            }),
            ...(newStatus === 'served' && {
                servedBy: userId,
                servedAt: new Date()
            })
        };

        const newItems = [
            ...state.items.slice(0, itemIndex),
            updatedItem,
            ...state.items.slice(itemIndex + 1)
        ];

        return {
            success: true,
            data: {
                ...state,
                items: newItems,
                updatedAt: new Date()
            }
        };
    },

    getTotal(state: OrderState): number {
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
};

// Helper functions
function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        'new': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['prepared', 'cancelled'],
        'prepared': ['served', 'cancelled'],
        'served': [],
        'cancelled': []
    };

    return validTransitions[from]?.includes(to) ?? false;
}

// Repository Interface
interface OrderRepository {
    save(order: OrderState): Promise<Result<OrderState>>;

    findById(orderId: string): Promise<Result<OrderState>>;

    findByStatus(status: OrderStatus): Promise<Result<OrderState[]>>;
}

// Implement a concrete repository
class InMemoryOrderRepository implements OrderRepository {
    private orders: Map<string, OrderState> = new Map();

    async save(order: OrderState): Promise<Result<OrderState>> {
        this.orders.set(order.orderId, order);
        return {success: true, data: order};
    }

    async findById(orderId: string): Promise<Result<OrderState>> {
        const order = this.orders.get(orderId);
        if (!order) {
            return {success: false, error: `Order ${orderId} not found`};
        }
        return {success: true, data: order};
    }

    async findByStatus(status: OrderStatus): Promise<Result<OrderState[]>> {
        const orders = Array.from(this.orders.values())
            .filter(order => order.status === status);
        return {success: true, data: orders};
    }
}

// Custom event types
interface OrderEvents {
    'orderStateChanged': {
        orderId: string;
        status: OrderStatus;
        updatedAt: Date;
    };
    'orderItemAdded': {
        orderId: string;
        itemId: string;
        menuItemId: string;
    };
    'orderConfirmed': {
        orderId: string;
        userId: string;
        timestamp: Date;
    };
}

// Custom EventEmitter type
class OrderEventEmitter extends EventEmitter {
    emit<K extends keyof OrderEvents>(event: K, data: OrderEvents[K]): boolean {
        return super.emit(event, data);
    }

    on<K extends keyof OrderEvents>(
        event: K,
        listener: (data: OrderEvents[K]) => void
    ): this {
        return super.on(event, listener);
    }
}

// Core interfaces that define shared behaviors
interface OrderViewer {
    getOrdersByStatus(status: OrderStatus): Promise<Result<OrderState[]>>;
    getOrderItemsByStatus(status: OrderStatus): Promise<Result<OrderItem[]>>;
    getOrderDetails(orderId: string): Promise<Result<OrderState>>;
}

interface OrderItemStatusManager {
    updateItemStatus(itemId: string, newStatus: OrderStatus, userId: string): Promise<Result<OrderState>>;
}

// Stakeholder-specific interfaces
interface AdminOperations extends OrderViewer {
    // Admin-specific actions
    getTableStatus(tableId: string): Promise<Result<TableStatus>>;
    getRevenueReport(dateRange: DateRange): Promise<Result<RevenueReport>>;
    manageMenuItem(item: MenuItem, action: 'create' | 'update' | 'delete'): Promise<Result<MenuItem>>;
    manageStaffAccess(userId: string, role: StaffRole): Promise<Result<void>>;
}

interface KitchenOperations extends OrderViewer, OrderItemStatusManager {
    // Kitchen-specific actions
    viewPendingOrders(): Promise<Result<OrderState[]>>;
    markItemPreparing(itemId: string, cookId: string): Promise<Result<OrderState>>;
    markItemPrepared(itemId: string, cookId: string): Promise<Result<OrderState>>;
    updatePreparationNote(itemId: string, note: string): Promise<Result<OrderState>>;
}

interface WaiterOperations extends OrderViewer, OrderItemStatusManager {
    // Waiter-specific actions
    generateTableQrCode(tableId: string): Promise<Result<string>>;
    assignTable(tableId: string, customerId: string): Promise<Result<TableStatus>>;
    markItemServed(itemId: string, waiterId: string): Promise<Result<OrderState>>;
    processPayment(orderId: string, paymentDetails: PaymentDetails): Promise<Result<PaymentStatus>>;
}

interface CustomerOperations extends OrderViewer {
    // Customer-specific actions
    createOrder(tableId: string): Promise<Result<OrderState>>;
    addItemToOrder(orderId: string, item: OrderItemRequest): Promise<Result<OrderState>>;
    modifyOrderItem(itemId: string, modifications: OrderItemModification): Promise<Result<OrderState>>;
    confirmOrder(orderId: string): Promise<Result<OrderState>>;
    requestBill(orderId: string): Promise<Result<Bill>>;
    makePayment(orderId: string, paymentDetails: PaymentDetails): Promise<Result<PaymentStatus>>;
}



// Order Module that manages state and persistence
class OrderModule implements OrderFunctions {
    private state: OrderState;
    private readonly repository: OrderRepository;
    private readonly eventEmitter: EventEmitter;

    constructor(
        initialState: OrderState,
        repository: OrderRepository,
        eventEmitter: EventEmitter
    ) {
        this.state = initialState;
        this.repository = repository;
        this.eventEmitter = eventEmitter;
    }

    private async updateState(
        operation: (state: OrderState) => Result<OrderState>
    ): Promise<Result<OrderState>> {
        const result = operation(this.state);
        if (!result.success) {
            return result;
        }

        const saveResult = await this.repository.save(result.data);
        if (!saveResult.success) {
            return saveResult;
        }

        this.state = saveResult.data;
        this.emitStateChange();
        return {success: true, data: this.state};
    }

    private emitStateChange() {
        this.eventEmitter.emit('orderStateChanged', {
            orderId: this.state.orderId,
            status: this.state.status,
            updatedAt: this.state.updatedAt
        });
    }

    async addItem(item: Omit<OrderItem, 'orderId'>): Promise<Result<OrderState>> {
        return this.updateState(state => OrderOperations.addItem(state, item));
    }

    async confirm(): Promise<Result<OrderState>> {
        return this.updateState(state => OrderOperations.confirm(state));
    }

    async updateItemStatus(
        itemId: string,
        newStatus: OrderStatus,
        userId: string
    ): Promise<Result<OrderState>> {
        return this.updateState(state =>
            OrderOperations.updateItemStatus(state, itemId, newStatus, userId)
        );
    }

    getTotal(): number {
        return OrderOperations.getTotal(this.state);
    }

    makePayment(): string {
    }

    getState(): OrderState {
        return {...this.state};
    }
}

// Usage Example
async function example() {
    // Create repository and event emitter instances
    const repository = new InMemoryOrderRepository();
    const eventEmitter = new OrderEventEmitter();

    // Set up event listeners
    eventEmitter.on('orderStateChanged', (data) => {
        console.log('Order state changed:', data);
    });

    eventEmitter.on('orderItemAdded', (data) => {
        console.log('Order item added:', data);
    });

    eventEmitter.on('orderConfirmed', (data) => {
        console.log('Order confirmed:', data);
    });

    const initialState: OrderState = {
        orderId: '123',
        tableId: 'T1',
        customerId: 'C1',
        items: [],
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const orderModule = new OrderModule(
        initialState,
        repository,
        eventEmitter
    );

    // Add multiple items
    const item1Result = await orderModule.addItem({
        id: 'item1',
        menuItemId: 'menu1',
        quantity: 2,
        price: 10.99,
        status: 'new',
        customizations: [],
        specialInstructions: null,
        preparedBy: null,
        servedBy: null,
        preparedAt: null,
        servedAt: null
    });

    const item2Result = await orderModule.addItem({
        id: 'item2',
        menuItemId: 'menu2',
        quantity: 1,
        price: 15.99,
        status: 'new',
        customizations: ['extra spicy'],
        specialInstructions: 'No onions',
        preparedBy: null,
        servedBy: null,
        preparedAt: null,
        servedAt: null
    });
    console.log('Item 1 added:', item1Result);
    console.log('Item 2 added:', item2Result);
    console.log('Current total:', orderModule.getTotal());

    // Confirm the order
    const waiterUserId = 'WAITER_001';
    const confirmResult = await orderModule.confirm();
    if (!confirmResult.success) {
        throw new Error(confirmResult.error);
    }

    // Update item statuses
    const cookUserId = 'COOK_001';
    await orderModule.updateItemStatus('item1', 'preparing', cookUserId);
    await orderModule.updateItemStatus('item2', 'preparing', cookUserId);

    // Mark items as prepared
    await orderModule.updateItemStatus('item1', 'prepared', cookUserId);
    await orderModule.updateItemStatus('item2', 'prepared', cookUserId);

    // Mark items as served
    await orderModule.updateItemStatus('item1', 'served', waiterUserId);
    await orderModule.updateItemStatus('item2', 'served', waiterUserId);

    // Get final state
    const finalState = orderModule.getState();
    console.log('Final order state:', JSON.stringify(finalState, null, 2));
}

// Error handling wrapper
async function runExample() {
    try {
        await example();
        console.log('Example completed successfully');
    } catch (err) {
        console.error('Example failed:', err instanceof Error ? err.message : err);
        // Re-throw the original error without wrapping it
        throw err;
    }
}

// Run the example
runExample().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
