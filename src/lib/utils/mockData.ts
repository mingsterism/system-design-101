import { MenuItem, Review, TimeSlot } from "../../types";

export const mockMenuItem: MenuItem = {
  id: "pizza1",
  name: "Pepperoni Pizza",
  description: "Classic pepperoni pizza with mozzarella",
  price: 18.99,
  category: "Pizza",
  subcategory: "Classic Pizzas",
  image: "pizza-image-url",
  allergens: ["dairy", "gluten"],
  nutritionalInfo: {
    calories: 250,
    protein: 12,
    carbohydrates: 30,
    fat: 10,
  },
  preparationTime: 20,
  isAvailable: true,
  isSpecial: false,
  customizationOptions: [
    {
      id: "size",
      name: "Size",
      options: [
        { id: "medium", name: "Medium", price: 0 },
        { id: "large", name: "Large", price: 4 },
      ],
    },
    {
      id: "extra",
      name: "Extra Toppings",
      options: [
        { id: "cheese", name: "Extra Cheese", price: 2 },
        { id: "pepperoni", name: "Extra Pepperoni", price: 2.5 },
      ],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockReviews: Review[] = [
  {
    id: "review1",
    userId: "user1",
    menuItemId: "pizza1",
    rating: 5,
    comment: "Best pizza in town!",
    serviceRating: 5,
    foodRating: 5,
    ambientRating: null,
    images: [],
    isPublished: true,
    createdAt: new Date(),
    orderId: "",
  },
];

export const mockTimeSlots: TimeSlot[] = [
  { id: "slot1", time: "18:00", isAvailable: true },
  { id: "slot2", time: "18:30", isAvailable: true },
  { id: "slot3", time: "19:00", isAvailable: false },
];
