import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string(), // for UI theming
      events: a.hasMany('Event', 'categoryID'),
    })
    .authorization((allow) => [
      // Public read access for Categories
      allow.guest().to(['read']),
      // Authenticated users can manage categories
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  Event: a
    .model({
      title: a.string().required(),
      description: a.string(),
      date: a.date().required(),
      time: a.time().required(),
      location: a.string().required(),
      capacity: a.integer().required(),
      remainingSpots: a.integer().required(),
      price: a.float().default(0), // optional, 0 for free events
      categoryID: a.id().required(),
      category: a.belongsTo('Category', 'categoryID'),
      imageUrl: a.string(),
      organizerID: a.string().required(),
      isActive: a.boolean().default(true),
      createdAt: a.timestamp(),
      updatedAt: a.timestamp(),
      bookings: a.hasMany('Booking', 'eventID'),
    })
    .authorization((allow) => [
      // Public can read events
      allow.guest().to(['read']),
      // Authenticated users can create and manage events
      allow.authenticated().to(['create', 'update', 'delete']),
    ]),

  Booking: a
    .model({
      eventID: a.id().required(),
      event: a.belongsTo('Event', 'eventID'),
      attendeeID: a.string().required(), // user who made the booking
      attendeeName: a.string().required(),
      attendeeEmail: a.string().required(),
      attendeePhone: a.string(),
      numberOfTickets: a.integer().default(1),
      status: a.enum(['CONFIRMED', 'PENDING', 'CANCELLED', 'WAITLIST']),
      bookingDate: a.timestamp(),
      totalAmount: a.float().required(),
    })
    .authorization((allow) => [
      // Anyone can create bookings
      allow.guest().to(['create']),
      // Authenticated users can view and manage bookings
      allow.authenticated().to(['read', 'update']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});