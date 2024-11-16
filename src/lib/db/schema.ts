import { pgTable, check, text, uuid, integer, boolean, real, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enhanced Enums with more specific statuses
export const roleEnum = pgEnum('role', [
    'admin',
    'customer',
    'waiter',
    'cook',
    'cashier'
]);

export const orderStatusEnum = pgEnum('order_status', [
    'new',
    'confirmed',
    'preparing',
    'prepared',
    'served',
    'completed',
    'cancelled'
]);

export const orderTypeEnum = pgEnum('order_type', [
    'dine_in',
    'takeaway',
    'delivery'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
    'pending',
    'authorized',
    'completed',
    'failed',
    'refunded'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
    'cash',
    'credit_card',
    'debit_card',
    'mobile_payment',
    'loyalty_points'
]);

export const tableStatusEnum = pgEnum('table_status', [
    'available',
    'occupied',
    'reserved',
    'cleaning'
]);

export const reservationStatusEnum = pgEnum('reservation_status', [
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
]);

// Enhanced User Management
export const users = pgTable('user', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: roleEnum('role').notNull(),
    phoneNumber: text('phone_number'),
    githubId: text('github_id'),
    loyaltyPoints: integer('loyalty_points').default(0),
    preferences: jsonb('preferences'), // Stores dietary preferences, favorites, etc.
    deliveryAddresses: jsonb('delivery_addresses'), // Array of saved addresses
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});


export const cartItems = pgTable('cart_item', {
    id: uuid('id').primaryKey().defaultRandom(),
    menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    price: real('price').notNull(),
    customizations: jsonb('customizations'),
    specialInstructions: text('special_instructions'),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Enhanced Session Management
export const sessions = pgTable('session', {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    deviceInfo: jsonb('device_info'),
    lastActivity: timestamp('last_activity', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

// Enhanced Menu Items
export const menuItems = pgTable('menu_item', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    price: real('price').notNull(),
    category: text('category').notNull(),
    subcategory: text('subcategory'),
    image: text('image_url'),
    allergens: jsonb('allergens'), // Array of allergens
    nutritionalInfo: jsonb('nutritional_info'),
    preparationTime: integer('preparation_time'), // in minutes
    isAvailable: boolean('is_available').default(true),
    isSpecial: boolean('is_special').default(false),
    customizationOptions: jsonb('customization_options'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [check('price_positive', sql`${table.price} > 0`)])

// Enhanced Table Management
export const tableSeating = pgTable('table_seating', {
    id: uuid('id').primaryKey().defaultRandom(),
    number: integer('number').notNull().unique(),
    capacity: integer('capacity').notNull(),
    status: tableStatusEnum('status').default('available'),
    currentWaiterId: uuid('current_waiter_id').references(() => users.id),
    section: text('section'), // For restaurant sectioning
    floorLevel: integer('floor_level').default(1),
    isActive: boolean('is_active').default(true),
    lastStatusChange: timestamp('last_status_change', { withTimezone: true }).defaultNow(),
    qrCode: text('qr_code'),
    metadata: jsonb('metadata') // For additional table properties
}, (table) => [
    check('capacity_positive', sql`${table.capacity} > 0`)
])

// Enhanced Orders
export const orders = pgTable('order', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull().unique(), // Human readable order number
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    tableId: uuid('table_id').references(() => tableSeating.id, { onDelete: 'set null' }),
    type: orderTypeEnum('type').notNull(),
    status: orderStatusEnum('status').notNull().default('new'),
    totalAmount: real('total_amount').notNull(),
    tax: real('tax').notNull(),
    serviceCharge: real('service_charge'),
    discount: real('discount').default(0),
    specialInstructions: text('special_instructions'),
    deliveryAddress: jsonb('delivery_address'),
    estimatedPreparationTime: integer('estimated_preparation_time'),
    actualPreparationTime: integer('actual_preparation_time'),
    assignedWaiterId: uuid('assigned_waiter_id').references(() => users.id),
    assignedCookId: uuid('assigned_cook_id').references(() => users.id),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Enhanced Order Items
export const orderItems = pgTable('order_item', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
        .notNull()
        .references(() => menuItems.id, { onDelete: 'cascade' }),
    status: orderStatusEnum('status').notNull(),
    quantity: integer('quantity').notNull(),
    price: real('price').notNull(), // Price at time of order
    customizations: jsonb('customizations'),
    specialInstructions: text('special_instructions'),
    preparedBy: uuid('prepared_by').references(() => users.id),
    servedBy: uuid('served_by').references(() => users.id),
    preparedAt: timestamp('prepared_at', { withTimezone: true }),
    servedAt: timestamp('served_at', { withTimezone: true })
}, (table) => [
    check('price_positive', sql`${table.price} > 0`),
    check('quantity_positive', sql`${table.quantity} > 0`)
])

// Group Orders
export const groupOrders = pgTable('group_order', {
    id: uuid('id').primaryKey().defaultRandom(),
    mainOrderId: uuid('main_order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    temporaryGroupId: text('temporary_group_id').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

// Enhanced Payments
export const payments = pgTable('payment', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    status: paymentStatusEnum('status').notNull(),
    method: paymentMethodEnum('method').notNull(),
    transactionId: text('transaction_id'),
    paymentIntentId: text('payment_intent_id'), // For payment gateway integration
    metadata: jsonb('metadata'), // For payment gateway specific data
    refundReason: text('refund_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Split Payments
export const splitPayments = pgTable('split_payment', {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
        .notNull()
        .references(() => payments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    status: paymentStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Enhanced Reviews
export const reviews = pgTable('review', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
        .references(() => menuItems.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    serviceRating: integer('service_rating'),
    foodRating: integer('food_rating'),
    ambientRating: integer('ambient_rating'),
    images: jsonb('images'), // Array of review images
    isPublished: boolean('is_published').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => [
    check('rating_range', sql`${table.rating} BETWEEN 1 AND 5`),
    check('service_rating_range', sql`${table.serviceRating} BETWEEN 1 AND 5`),
    check('food_rating_range', sql`${table.foodRating} BETWEEN 1 AND 5`),
    check('ambient_rating_range', sql`${table.ambientRating} BETWEEN 1 AND 5`)
])

// Enhanced Inventory
export const inventory = pgTable('inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    menuItemId: uuid('menu_item_id')
        .notNull()
        .references(() => menuItems.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    unit: text('unit').notNull(),
    minThreshold: integer('min_threshold').notNull(),
    maxThreshold: integer('max_threshold'),
    location: text('location'),
    supplier: text('supplier'),
    cost: real('cost').notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    lastRestocked: timestamp('last_restocked', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
    check('quantity_positive', sql`${table.quantity} >= 0`),
    check('threshold_valid', sql`${table.minThreshold} <= ${table.maxThreshold}`)
])

// Inventory Transactions
export const inventoryTransactions = pgTable('inventory_transaction', {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryId: uuid('inventory_id')
        .notNull()
        .references(() => inventory.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'in' or 'out'
    quantity: integer('quantity').notNull(),
    reason: text('reason').notNull(),
    orderId: uuid('order_id').references(() => orders.id),
    performedBy: uuid('performed_by')
        .notNull()
        .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Shifts
export const shifts = pgTable('shift', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    type: text('type').notNull(), // 'morning', 'afternoon', 'evening'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});


// Enhanced Reservations
export const reservations = pgTable('reservation', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    tableId: uuid('table_id')
        .notNull()
        .references(() => tableSeating.id, { onDelete: 'cascade' }),
    date: timestamp('date', { withTimezone: true }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    numberOfGuests: integer('number_of_guests').notNull(),
    status: reservationStatusEnum('status').notNull(),
    specialRequests: text('special_requests'),
    occasionType: text('occasion_type'), // birthday, anniversary, etc.
    assignedWaiterId: uuid('assigned_waiter_id').references(() => users.id),
    confirmationSent: boolean('confirmation_sent').default(false),
    reminderSent: boolean('reminder_sent').default(false),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
    check('guest_positive', sql`${table.numberOfGuests} > 0`),
    check('valid_time_range', sql`${table.endTime} > ${table.startTime}`)
])

// Waitlist Management
export const waitlist = pgTable('waitlist', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    numberOfGuests: integer('number_of_guests').notNull(),
    estimatedWaitTime: integer('estimated_wait_time'), // in minutes
    status: text('status').notNull(), // waiting, seated, cancelled
    notes: text('notes'),
    notificationPreference: text('notification_preference'), // sms, email, both
    quotedTime: timestamp('quoted_time', { withTimezone: true }),
    seatedTime: timestamp('seated_time', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Customer Notifications
export const notifications = pgTable('notification', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // order_status, reservation, promotion, etc.
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false),
    metadata: jsonb('metadata'),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Promotions and Loyalty Programs
export const promotions = pgTable('promotion', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    type: text('type').notNull(), // discount, loyalty_points, free_item
    value: real('value'), // discount amount or points
    code: text('code').unique(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').default(true),
    minimumOrderAmount: real('minimum_order_amount'),
    maximumDiscount: real('maximum_discount'),
    usageLimit: integer('usage_limit'),
    currentUsage: integer('current_usage').default(0),
    applicableItems: jsonb('applicable_items'), // Array of menu item IDs
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => [
    check('valid_date_range', sql`${table.endDate} > ${table.startDate}`)
])

// Promotion Usage Tracking
export const promotionUsage = pgTable('promotion_usage', {
    id: uuid('id').primaryKey().defaultRandom(),
    promotionId: uuid('promotion_id')
        .notNull()
        .references(() => promotions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    discountAmount: real('discount_amount'),
    pointsEarned: integer('points_earned'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Kitchen Display System (KDS) Stations
export const kdsStations = pgTable('kds_station', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: text('type').notNull(), // grill, salad, dessert, etc.
    isActive: boolean('is_active').default(true),
    assignedCooks: jsonb('assigned_cooks'), // Array of cook user IDs
    printerIp: text('printer_ip'),
    displaySettings: jsonb('display_settings'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Kitchen Order Routing
export const kdsOrderRouting = pgTable('kds_order_routing', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderItemId: uuid('order_item_id')
        .notNull()
        .references(() => orderItems.id, { onDelete: 'cascade' }),
    stationId: uuid('station_id')
        .notNull()
        .references(() => kdsStations.id, { onDelete: 'cascade' }),
    priority: integer('priority').default(1),
    estimatedPrepTime: integer('estimated_prep_time'),
    status: text('status').notNull(), // queued, in_progress, completed
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// System Settings
export const systemSettings = pgTable('system_setting', {
    id: uuid('id').primaryKey().defaultRandom(),
    category: text('category').notNull(),
    key: text('key').notNull(),
    value: jsonb('value').notNull(),
    description: text('description'),
    lastModifiedBy: uuid('last_modified_by')
        .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Audit Logs
export const auditLogs = pgTable('audit_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .references(() => users.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});
