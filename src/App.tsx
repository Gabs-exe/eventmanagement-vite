import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import {
  useAuthenticator,
  Button,
  Heading,
  View,
  Card,
  TextField,
  TextAreaField,
  SelectField,
  Flex,
  Badge,
  Text,
  Loader,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const client = generateClient<Schema>();

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  remainingSpots: number;
  categoryID: string;
  organizerID: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Booking {
  id: string;
  eventID: string;
  attendeeID: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'WAITLIST';
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, signOut, signIn } = useAuthenticator();
  const isAuthenticated = !!user;

  // Load events and categories
  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const categoriesData = await client.models.Category.list();
        setCategories(categoriesData.data);

        // Load events
        const eventsData = await client.models.Event.list();
        setEvents(eventsData.data);

        // Load user bookings if authenticated
        if (isAuthenticated) {
          const bookingsData = await client.models.Booking.list({
            filter: { attendeeID: { eq: user.userId } }
          });
          setUserBookings(bookingsData.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  async function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to create events');
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const newEvent = await client.models.Event.create({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        location: formData.get('location') as string,
        capacity: parseInt(formData.get('capacity') as string),
        remainingSpots: parseInt(formData.get('capacity') as string),
        categoryID: formData.get('categoryID') as string,
        organizerID: user.userId,
      });

      setEvents([...events, newEvent]);
      setIsCreatingEvent(false);
      form.reset();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  }

  async function bookEvent(eventId: string) {
    if (!isAuthenticated) {
      alert('Please sign in to book events');
      return;
    }

    try {
      const event = events.find(e => e.id === eventId);
      if (!event || event.remainingSpots <= 0) {
        throw new Error('No available spots');
      }

      // Create booking
      const booking = await client.models.Booking.create({
        eventID: eventId,
        attendeeID: user.userId,
        status: 'CONFIRMED',
      });

      // Update event remaining spots
      await client.models.Event.update({
        id: eventId,
        remainingSpots: event.remainingSpots - 1,
      });

      setUserBookings([...userBookings, booking]);
      setEvents(events.map(e => 
        e.id === eventId 
          ? { ...e, remainingSpots: e.remainingSpots - 1 }
          : e
      ));
    } catch (error) {
      console.error('Error booking event:', error);
      alert('Failed to book event');
    }
  }

  if (loading) {
    return (
      <View padding="1rem">
        <Loader size="large" />
      </View>
    );
  }

  return (
    <View padding="1rem">
      <Flex direction="column" gap="1rem">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading level={1}>Event Booking Platform</Heading>
          {isAuthenticated ? (
            <Flex gap="1rem">
              <Text>Welcome, {user.signInDetails?.loginId}!</Text>
              <Button onClick={signOut}>Sign Out</Button>
            </Flex>
          ) : (
            <Button onClick={signIn}>Sign In</Button>
          )}
        </Flex>

        <Flex direction="row" gap="1rem">
          <SelectField
            label="Filter by Category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          {isAuthenticated && (
            <Button onClick={() => setIsCreatingEvent(!isCreatingEvent)}>
              {isCreatingEvent ? 'Cancel' : 'Create Event'}
            </Button>
          )}
        </Flex>

        {isCreatingEvent && (
          <Card>
            <form onSubmit={createEvent}>
              <Flex direction="column" gap="1rem">
                <TextField label="Title" name="title" required />
                <TextAreaField label="Description" name="description" />
                <TextField label="Date" name="date" type="date" required />
                <TextField label="Time" name="time" type="time" required />
                <TextField label="Location" name="location" required />
                <TextField label="Capacity" name="capacity" type="number" required />
                <SelectField label="Category" name="categoryID" required>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectField>
                <Button type="submit">Create Event</Button>
              </Flex>
            </form>
          </Card>
        )}

        <Heading level={2}>Upcoming Events</Heading>
        <Flex direction="row" wrap="wrap" gap="1rem">
          {events
            .filter(event => !selectedCategory || event.categoryID === selectedCategory)
            .map(event => (
              <Card key={event.id} variation="elevated" width="300px">
                <Heading level={3}>{event.title}</Heading>
                <Text>{event.description}</Text>
                <Flex direction="column" gap="0.5rem">
                  <Text>📅 {new Date(event.date).toLocaleDateString()}</Text>
                  <Text>⏰ {event.time}</Text>
                  <Text>📍 {event.location}</Text>
                  <Badge variation={event.remainingSpots > 0 ? "info" : "error"}>
                    {event.remainingSpots} spots remaining
                  </Badge>
                </Flex>
                <Button
                  onClick={() => bookEvent(event.id)}
                  isDisabled={
                    !isAuthenticated ||
                    event.remainingSpots <= 0 ||
                    userBookings.some(b => b.eventID === event.id)
                  }
                  marginTop="1rem"
                >
                  {!isAuthenticated
                    ? "Sign in to Book"
                    : userBookings.some(b => b.eventID === event.id)
                    ? "Already Booked"
                    : "Book Event"}
                </Button>
              </Card>
            ))}
        </Flex>
      </Flex>
    </View>
  );
}

export default App;