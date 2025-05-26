import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string(), // for UI theming
      events: a.hasMany('Event'),
    })
    .authorization([
      // Public read access for Categories
      a.allow.public().to(['read']),
      // Only admins should be able to manage categories
      a.allow.private().to(['create', 'update', 'delete']),
    ]),

  Event: a
    .model({
      title: a.string().required(),
      description: a.string(),
      startDateTime: a.datetime().required(),
      endDateTime: a.datetime().required(),
      location: a.string().required(),
      capacity: a.integer().required(),
      availableSpots: a.integer().required(),
      price: a.float(), // optional, 0 for free events
      category: a.belongsTo('Category'),
      imageUrl: a.string(),
      organizerId: a.string().required(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      bookings: a.hasMany('Booking'),
    })
    .authorization([
      // Public can read events
      a.allow.public().to(['read']),
      // Authenticated users can create events
      a.allow.authenticated().to(['create']),
      // Event owners can update/delete their events
      a.allow.owner('organizerId').to(['update', 'delete']),
    ]),

  Booking: a
    .model({
      eventId: a.string().required(),
      userId: a.string(), // optional for anonymous bookings
      attendeeName: a.string().required(),
      attendeeEmail: a.string().required(),
      attendeePhone: a.string(),
      numberOfTickets: a.integer().default(1),
      bookingStatus: a.enum(['CONFIRMED', 'PENDING', 'CANCELLED']).required(),
      bookingDate: a.datetime().required(),
      totalAmount: a.float().required(),
      event: a.belongsTo('Event'),
    })
    .authorization([
      // Anyone can create bookings
      a.allow.public().to(['create']),
      // Users can only view their own bookings
      a.allow.owner('userId').to(['read']),
      // Event organizer can view all bookings for their events
      a.allow.private().to(['read']).when(ctx => 
        ctx.source.event.organizerId === ctx.identity.username
      ),
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