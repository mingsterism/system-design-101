# Description

a menu ordering system whereby users can order food and pay through the app. there's also a kitchen display system for the waiter and cooks to manage the orders. Users can also order takeaway and delivery from the app itself.

# system entities

user, admin, sys

# Entities

user:customer, sys:chatbot, user:cashier, user:waiter, user:cook

# Objects

menuItem, order, orderItem, payment, table, cart

# Object Statuses

orderItem - confirmed - completed

# DETAILED

# Description

# Classes
these are things where it's long lived and it will have it's own state. encapsulating it's own state is critical. 
the only way to communicate with that state is to go through the methods of that object. 
however, the premise of functional is that the methods will always read from just the arguments that are passed in. 
how can we reconcile these two things?


A comprehensive restaurant management system that enables:

- In-store dining with QR code-based ordering
- Takeaway ordering
- Delivery service
- Kitchen display system for order management
- Real-time order tracking
- Integrated payment processing
- AI chatbot for customer assistance
- Multi-user group ordering capability

# System Entities

- user: End users of the system
- admin: Restaurant staff with administrative privileges
- sys: System components (chatbot, notifications, etc.)

# Entities

## user:customer

- Properties:
  - customerId: string
  - name: string
  - email: string
  - phone: string
  - orderHistory: Order[]
  - savedPaymentMethods: PaymentMethod[]
  - deliveryAddresses: Address[]

## sys:chatbot

- Properties:
  - chatId: string
  - conversationHistory: Message[]
- Capabilities:
  - Menu recommendations
  - Dietary restrictions handling
  - Order placement
  - Order status inquiries
  - FAQ handling

## user:cashier

- Properties:
  - employeeId: string
  - name: string
  - shift: ShiftTime
- Responsibilities:
  - Payment processing
  - Refund handling
  - Bill splitting
  - Order management

## user:waiter

- Properties:
  - employeeId: string
  - name: string
  - assignedTables: Table[]
  - shift: ShiftTime
- Responsibilities:
  - Table management
  - Order status updates
  - Customer service
  - QR code distribution

## user:cook

- Properties:
  - employeeId: string
  - name: string
  - specialization: string[]
  - shift: ShiftTime
- Responsibilities:
  - Order preparation
  - Status updates
  - Kitchen inventory management

# Objects

## menuItem

- Properties:
  - itemId: string
  - name: string
  - description: string
  - price: number
  - category: string
  - allergens: string[]
  - preparationTime: number
  - available: boolean
  - image: string
  - customizationOptions: CustomizationOption[]

## order

- Properties:
  - orderId: string
  - tableId: string (optional)
  - customerId: string
  - orderItems: OrderItem[]
  - totalAmount: number
  - status: OrderStatus
  - orderType: 'dine-in' | 'takeaway' | 'delivery'
  - createdAt: timestamp
  - updatedAt: timestamp
  - paymentStatus: PaymentStatus
  - specialInstructions: string

## orderItem

- Properties:
  - orderItemId: string
  - menuItemId: string
  - quantity: number
  - customizations: Customization[]
  - status: OrderItemStatus
  - notes: string

## payment

- Properties:
  - paymentId: string
  - orderId: string
  - amount: number
  - method: PaymentMethod
  - status: PaymentStatus
  - transactionId: string
  - timestamp: timestamp
  - splitDetails: SplitPayment[]

## table

- Properties:
  - tableId: string
  - capacity: number
  - status: TableStatus
  - currentOrderId: string
  - qrCode: string
  - waiterId: string

## cart

- Properties:
  - cartId: string
  - customerId: string
  - orderItems: OrderItem[]
  - subtotal: number
  - tableId: string (optional)
  - temporaryGroupId: string

# Object Statuses

## orderItem

- new: Initial state when added to cart
- confirmed: Order has been placed
- preparing: Cook has started preparation
- prepared: Food is ready for service
- served: Delivered to customer
- completed: Order finished and paid
- cancelled: Order cancelled

## order

- created: Initial state
- confirmed: Payment confirmed
- inProgress: Being prepared
- ready: Ready for pickup/service
- completed: Delivered and finished
- cancelled: Order cancelled

## table

- available: Ready for new customers
- occupied: Currently in use
- reserved: Booked for future use
- cleaning: Being prepared for next customers

## payment

- pending: Awaiting processing
- authorized: Payment method verified
- completed: Successfully processed
- failed: Transaction failed
- refunded: Payment returned

# Pages

## Menu

- Features:
  - Category-based item browsing
  - Search functionality
  - Filters (dietary, price range, etc.)
  - Item customization options
  - Real-time availability updates
  - Detailed item descriptions and images
  - Add to cart functionality
  - Group order visualization

## KitchenDisplay

- Features:
  - Real-time order queue
  - Order prioritization
  - Preparation time tracking
  - Status update controls
  - Order details expansion
  - Dietary restriction alerts
  - Table number display
  - Order type indicators

## Tables

- Features:
  - Interactive table layout
  - Status indicators
  - Order summary per table
  - Payment status
  - Waiter assignment
  - Table history
  - Capacity indicators
  - QR code management

## Cart & Checkout

- Features:
  - Item review
  - Quantity adjustment
  - Special instructions
  - Group order summary
  - Payment method selection
  - Split payment options
  - Order type selection
  - Delivery information (if applicable)

## Order History

- Features:
  - Past order details
  - Reorder functionality
  - Receipt download
  - Feedback submission
  - Order tracking
  - Payment history

# User Journeys

## Walk in customer ordering

    - customer enters the shop
    - admin scans the QR code to generate a new order with the table number
    - the waiter hands the QR code to the customer to scan
    - customer scans the QR code and goes to the menu page to view all the orders
    - the customer's friends also scan the same QR code and they go to the same menu page.
    - the customer can browse all the menu items.
    - The customer can add any menu item to the cart. The customer can see all the items in the cart together with their friends orders
    - any of the customers can confirm their own order only but they can see their order and the group order
    - when order is confirmed it goes to kitchen display where the cook can see the order and the orderItem
    - the cook will cook the food and serve to the waiter. The waiter will update the order status to prepared
    - the waiter will serve the food to the customer
    - the customer can continue to order more by going to the same menu page and adding orders. they can see their current orders already done and the status. They can also add new orders and confirm those orders
    - the customer can talk to the chatbot to ask questions about food. The chatbot can answer and give recommendations and place orders for them. All orders from the chatbot will be reflected in the customer's own menu order page.
    - once the customers are done, they go to their orders and click payment. they can either do group payment or just pay for their own orders or enter a custom amount they wish to pay. they can then pay online through the integrated third party payment gateway

## Customer order takeaway

1. Customer opens restaurant app/website
2. Browses menu and adds items to cart
3. Selects takeaway as order type
4. Specifies pickup time
5. Reviews order and confirms
6. Makes payment
7. Receives confirmation with pickup instructions
8. Gets notifications about order status
9. Arrives at restaurant and shows order ID
10. Collects order and confirms receipt

## Delivery order

1. Customer selects delivery option
2. Enters/selects delivery address
3. Chooses delivery time slot
4. Places order and makes payment
5. Receives confirmation and tracking link
6. Gets updates about preparation and delivery
7. Receives order and confirms delivery

# Routes

## Customer Routes

- GET /:restaurantId/tables
- GET /:restaurantId/menu
- GET /:restaurantId/menu/:orderId/place
- GET /:restaurantId/menu/:orderId/review
- POST /:restaurantId/orders
- GET /:restaurantId/orders/:orderId
- PUT /:restaurantId/orders/:orderId/pay

## Kitchen Routes

- GET /:restaurantId/kitchen/orders
- PUT /:restaurantId/kitchen/orders/:orderId/status
- GET /:restaurantId/kitchen/queue

## Admin Routes

- GET /:restaurantId/admin/tables
- PUT /:restaurantId/admin/tables/:tableId
- GET /:restaurantId/admin/orders
- PUT /:restaurantId/admin/menu

## Payment Routes

- POST /:restaurantId/payments/create
- POST /:restaurantId/payments/confirm
- POST /:restaurantId/payments/split

# Actions

## Customer Actions

- Browse menu items
- Add items to cart
- Modify cart items
- Place order
- Make payment
- Split bill
- Track order status
- Submit feedback
- Save favorite items
- Request assistance

## Chatbot Actions

- Answer queries
- Provide recommendations
- Place orders
- Check order status
- Handle complaints
- Process special requests

## Kitchen Staff Actions

- View orders
- Update order status
- Manage queue
- Mark items as unavailable
- Add preparation notes
- Request waiter pickup

## Waiter Actions

- Manage tables
- Update order status
- Process payments
- Handle special requests
- Generate QR codes
- Mark tables as available/occupied

## Admin Actions

- Manage menu
- View reports
- Handle refunds
- Manage staff
- Configure system settings
- View analytics



# Core logic
At the interface level we design all the stakeholder functions that they will do. 
The these stakeholder functions will only work with specific objects. all the functions
used in these stakeholder functions will be functional stateless functions. 
these interfaces will be used in actual classes. 

what if we made the classes as the objects instead. the fundamental idea is that the functions
will mutate the objects. 

for the stakeholders, they shall have their own functions as well that is just unique to them. 
the concept of state is that methods work around the objects. 

menuPage
1. addItemToCart. when the user adds an item to cart, then the local state is updated. when 
adding item to cart, there can be function that handles cart local storage. so it will need to pass
in a local storage object and the function will just save everything to localstorage in that method. 
2. confirmItems. the user confirms all the items they can pass in their items. then it will 
save to the database. can we abstract out the user functions from the classes. and put classes around objects
instead. or perhaps users and objects will have their own methods. Users will accept in objects as input. 
the user can do actions which will be called on the main page. but within the user functions, the object methods
are being used to directly update the object state itself. For example: user update cart, user confirm order, 
admin update menuItem. when updating menuItem, it will be this.menuItem.update(menuItem). the menuItem will 
have it's own methods that allow to communicate and mutate it. but for querying data, we can use general query functions
