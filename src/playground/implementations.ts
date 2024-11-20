import {
    CustomerCommands,
    StateRepositoryCommands,
    StateRepositoryQueries
} from "./interfaces";
import {
    MenuItem,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentStatus
} from "../types";


class CustomerService implements CustomerCommands {
    private readonly stateQueries: StateRepositoryQueries;
    private readonly stateCommands: StateRepositoryCommands;
    private orderItem: OrderItem;

    constructor(
        stateFuncQueries: StateRepositoryQueries,
        stateFuncCommands: StateRepositoryCommands,
        orderItem: OrderItem,
    ) {
        this.stateQueries = stateFuncQueries
        this.stateCommands = stateFuncCommands
        this.orderItem = orderItem
    }

    addOrderItem(orderId: string, item: OrderItemRequest): Promise<Result<void>> {
        // add order item to the current order item
        // we don't need to save it in the DB yet.
        return Promise.resolve(undefined);
    }

    confirmOrder(orderId: string): Promise<Result<void>> {
        return Promise.resolve(undefined);
    }

    createOrder(tableId: string, customerId: string): Promise<Result<void>> {
        return Promise.resolve(undefined);
    }

    makePayment(orderId: string, paymentDetails: PaymentDetails): Promise<Result<void>> {
        return Promise.resolve(undefined);
    }

    modifyOrderItem(itemId: string, modifications: OrderItemModification): Promise<Result<void>> {
        return Promise.resolve(undefined);
    }

    requestBill(orderId: string): Promise<Result<void>> {
        return Promise.resolve(undefined);
    }

}
