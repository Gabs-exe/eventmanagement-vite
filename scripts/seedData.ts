import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>({
  authMode: 'apiKey'
});

const categories = [
  {
    name: "Concerts",
    description: "Live music performances and concerts",
    color: "#FF6B6B"
  },
  {
    name: "Workshops",
    description: "Educational workshops and training sessions",
    color: "#4ECDC4"
  },
  {
    name: "Sports",
    description: "Sports events and athletic competitions",
    color: "#45B7D1"
  },
  {
    name: "Conferences",
    description: "Professional conferences and seminars",
    color: "#96CEB4"
  },
  {
    name: "Art & Culture",
    description: "Art exhibitions, theater, and cultural events",
    color: "#FECA57"
  },
  {
    name: "Food & Drink",
    description: "Food festivals, tastings, and culinary events",
    color: "#FF9FF3"
  }
];

async function seedCategories() {
  console.log("Seeding categories...");
  console.log("Client models:", Object.keys(client.models || {}));
  
  try {
    for (const category of categories) {
      console.log("Creating category:", category.name);
      const result = await client.models.Category.create(category);
      console.log(`Created category: ${result.data?.name}`);
    }
    console.log("✅ Categories seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
}

async function seedSampleEvents() {
  console.log("Seeding sample events...");
  
  try {
    // First, get existing categories
    const categoriesResult = await client.models.Category.list();
    const categories = categoriesResult.data;
    
    if (categories.length === 0) {
      console.log("No categories found. Please seed categories first.");
      return;
    }

    const sampleEvents = [
      {
        title: "Summer Music Festival",
        description: "Join us for an amazing outdoor music festival featuring local and international artists.",
        date: "2025-07-15",
        time: "18:00",
        location: "Central Park, New York",
        capacity: 500,
        remainingSpots: 500,
        price: 75.00,
        categoryID: categories.find(c => c.name === "Concerts")?.id || categories[0].id,
        organizerID: "sample-organizer-1",
        isActive: true
      },
      {
        title: "Web Development Workshop",
        description: "Learn modern web development techniques with React and TypeScript.",
        date: "2025-06-20",
        time: "09:00",
        location: "Tech Hub, San Francisco",
        capacity: 30,
        remainingSpots: 30,
        price: 0, // Free event
        categoryID: categories.find(c => c.name === "Workshops")?.id || categories[0].id,
        organizerID: "sample-organizer-2",
        isActive: true
      },
      {
        title: "Local Basketball Tournament",
        description: "Community basketball tournament for all skill levels.",
        date: "2025-06-10",
        time: "14:00",
        location: "Community Sports Center",
        capacity: 100,
        remainingSpots: 100,
        price: 10.00,
        categoryID: categories.find(c => c.name === "Sports")?.id || categories[0].id,
        organizerID: "sample-organizer-3",
        isActive: true
      }
    ];

    for (const event of sampleEvents) {
      const result = await client.models.Event.create(event);
      console.log(`Created event: ${result.data?.title}`);
    }
    
    console.log("✅ Sample events seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding events:", error);
  }
}

// Run the seeding
async function main() {
  await seedCategories();
  await seedSampleEvents();
  process.exit(0);
}

main().catch(console.error);
