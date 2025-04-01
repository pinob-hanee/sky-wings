const express = require("express");
const cors = require("cors");
const Amadeus = require("amadeus");
const { log } = require("console");
require("dotenv").config();
const NodeCache = require("node-cache");
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const app = express();
const port = 3001;

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

const flightCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skywings';
let db;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    db = mongoose.connection.db;
    
    // Create indexes for better query performance
    db.collection('bookings').createIndex({ bookingReference: 1 });
    db.collection('bookings').createIndex({ 'passengers.email': 1 });
    db.collection('bookings').createIndex({ 'passengers.lastName': 1 });
    db.collection('bookings').createIndex({ 'flight.departure': 1 });
    
    // Seed sample bookings
    seedSampleBookings();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Define Booking Schema (for validation)
const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['CONFIRMED', 'CANCELLED', 'PENDING'], required: true },
  createdAt: { type: Date, default: Date.now },
  cancelledAt: Date,
  cancellationReason: String,
  flight: {
    from: { type: String, required: true },
    to: { type: String, required: true },
    departure: { type: Date, required: true },
    arrival: { type: Date, required: true },
    airline: String,
    flightNumber: String
  },
  passengers: [{
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: String,
    phone: String,
    gender: String,
    dateOfBirth: Date
  }],
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' }
});

const Booking = mongoose.model('Booking', bookingSchema);

app.use(cors());
app.use(express.json());

// Function to retry API requests with exponential backoff
async function fetchWithRetry(apiCall, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await apiCall();
      if (response.statusCode !== 429) return response;
      console.warn(`Rate limit hit. Retrying in ${delayMs / 1000} seconds...`);
      await new Promise((res) => setTimeout(res, delayMs));
      delayMs *= 2; // Exponential backoff
    } catch (error) {
      console.error("Error fetching:", error);
    }
  }
  throw new Error("Max retries reached");
}

// Flight search API
app.get("/api/flights", async (req, res) => {
  try {
    const { 
      from, 
      to, 
      date, 
      returnDate, 
      adults = "1", 
      travelClass = "ECONOMY", 
      airline = "",
      directOnly = "false"
    } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Use IATA codes directly from user input
    const originCode = from.trim().toUpperCase();
    const destinationCode = to.trim().toUpperCase();

    // Validate IATA code format (3 uppercase letters)
    const iataCodeRegex = /^[A-Z]{3}$/;
    if (!iataCodeRegex.test(originCode) || !iataCodeRegex.test(destinationCode)) {
      return res.status(400).json({ error: "Invalid IATA code format. Please use 3-letter airport codes (e.g., JFK, LAX, LHR)" });
    }

    console.log("Origin Code:", originCode, "Destination Code:", destinationCode);
    console.log("Direct Only (raw):", req.query.directOnly);
    console.log("Direct Only (parsed):", directOnly);
    console.log("Direct Only (type):", typeof directOnly);
    console.log("Direct Only (comparison):", directOnly === "true");

    // Build flight search parameters
    const flightParams = {
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: date,
      adults,
      travelClass,
      max: 20, // Increase max results to have more options
    };

    // Add direct flights filter if requested
    if (directOnly === "true") {
      console.log("Adding nonStop parameter to request");
      flightParams.nonStop = true;
    }

    if (returnDate) {
      flightParams.returnDate = returnDate;
    }

    // Fetch flight offers with retry logic
    const response = await fetchWithRetry(() =>
      amadeus.shopping.flightOffersSearch.get(flightParams)
    );

    if (!response.data || response.data.length === 0) {
      return res.json({ message: "No flights found" });
    }

    // Store the raw flight offers in cache for later retrieval
    flightCache.set("recentFlights", response.data);

    // Filter flights by airline if provided
    let flights = response.data;
    if (airline.trim() !== "") {
      flights = flights.filter((flight) =>
        flight.validatingAirlineCodes.includes(airline.toUpperCase())
      );
    }

    if (flights.length === 0) {
      return res.json({ message: `No flights found for airline: ${airline.toUpperCase()}` });
    }

    // Filter flights to ensure final destination matches requested destination
    flights = flights.filter(flight => {
      const segments = flight.itineraries[0].segments;
      const lastSegment = segments[segments.length - 1];
      return lastSegment.arrival.iataCode === destinationCode;
    });

    if (flights.length === 0) {
      return res.json({ message: "No flights found with the requested final destination" });
    }

    // Sort flights by price
    flights.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));

    // Transform response with more detailed information
    const formattedFlights = flights.map((offer) => {
      const segments = offer.itineraries[0].segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      return {
        id: offer.id,
        from: firstSegment.departure.iataCode,
        to: lastSegment.arrival.iataCode,
        departure: firstSegment.departure.at,
        arrival: lastSegment.arrival.at,
        price: offer.price.total,
        currency: offer.price.currency,
        airline: firstSegment.carrierCode,
        flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
        travelClass,
        stops: segments.length - 1,
        duration: offer.itineraries[0].duration,
        segments: segments.map(segment => ({
          from: segment.departure.iataCode,
          to: segment.arrival.iataCode,
          departure: segment.departure.at,
          arrival: segment.arrival.at,
          flightNumber: `${segment.carrierCode}${segment.number}`,
          duration: segment.duration
        }))
      };
    });

    res.json(formattedFlights);
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({
      error: "Failed to fetch flights",
      details: error.response?.data?.errors || error.message,
    });
  }
});

// Get flight details by ID
app.get("/api/flights/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real application, you would fetch this from a database
    // For now, we'll use the Amadeus API to get flight details
    
    // First, get the flight offer from the cache or re-fetch it
    const cachedFlights = flightCache.get("recentFlights") || [];
    let flightOffer = cachedFlights.find(flight => flight.id === id);
    
    if (!flightOffer) {
      return res.status(404).json({ error: "Flight not found" });
    }
    
    // Format the flight data for the frontend
    const flight = {
      id: flightOffer.id,
      from: flightOffer.itineraries[0].segments[0].departure.iataCode,
      to: flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.iataCode,
      departure: flightOffer.itineraries[0].segments[0].departure.at,
      arrival: flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.at,
      price: flightOffer.price.total,
      currency: flightOffer.price.currency,
      airline: flightOffer.validatingAirlineCodes[0],
      flightNumber: flightOffer.itineraries[0].segments[0].number,
      travelClass: flightOffer.travelerPricings[0].fareDetailsBySegment[0].cabin,
      stops: flightOffer.itineraries[0].segments.length - 1,
      duration: flightOffer.itineraries[0].duration,
      segments: flightOffer.itineraries[0].segments.map(segment => ({
        from: segment.departure.iataCode,
        to: segment.arrival.iataCode,
        departure: segment.departure.at,
        arrival: segment.arrival.at,
        flightNumber: segment.number,
        duration: segment.duration,
        airline: segment.carrierCode
      }))
    };
    
    res.json(flight);
  } catch (error) {
    console.error("Error fetching flight details:", error);
    res.status(500).json({ error: "Failed to fetch flight details" });
  }
});

// Create a booking
app.post("/api/bookings", async (req, res) => {
  try {
    const { flightId, passengers, payment } = req.body;
    
    // Get the flight details
    const cachedFlights = flightCache.get("recentFlights") || [];
    const flightOffer = cachedFlights.find(flight => flight.id === flightId);
    
    if (!flightOffer) {
      return res.status(404).json({ error: "Flight not found" });
    }
    
    // Generate a booking reference
    const bookingReference = `SKY${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Create booking object with MongoDB schema in mind
    const booking = {
      bookingReference,
      flightId,
      flight: {
        from: flightOffer.itineraries[0].segments[0].departure.iataCode,
        to: flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.iataCode,
        departure: new Date(flightOffer.itineraries[0].segments[0].departure.at),
        arrival: new Date(flightOffer.itineraries[0].segments[flightOffer.itineraries[0].segments.length - 1].arrival.at),
        airline: flightOffer.validatingAirlineCodes[0],
        flightNumber: flightOffer.itineraries[0].segments[0].number,
      },
      passengers,
      totalPrice: parseFloat(flightOffer.price.total) * passengers.length,
      currency: flightOffer.price.currency,
      status: "CONFIRMED",
      createdAt: new Date()
    };
    
    // Save to MongoDB
    await db.collection('bookings').insertOne(booking);
    
    // In a real app, you would send a confirmation email here
    
    res.status(201).json({ 
      success: true, 
      bookingReference,
      booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get booking by reference
app.get("/api/admin/bookings/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Find booking in MongoDB
    const booking = await db.collection('bookings').findOne({ bookingReference: reference });
    
    if (!booking) {
      // For demo purposes, create a mock booking if not found
      if (reference.startsWith("SKY")) {
        const mockBooking = {
          bookingReference: reference,
          status: "CONFIRMED",
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          flight: {
            from: "JFK",
            to: "LAX",
            departure: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            arrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
            airline: "AA",
            flightNumber: "1234",
          },
          passengers: [
            {
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              phone: "+1234567890"
            }
          ],
          totalPrice: 349.99,
          currency: "USD"
        };
        
        // Save the mock booking to the database
        await db.collection('bookings').insertOne(mockBooking);
        
        return res.json(mockBooking);
      }
      
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Failed to fetch booking details" });
  }
});

// Cancel booking
app.post("/api/admin/bookings/:reference/cancel", async (req, res) => {
  try {
    const { reference } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: "Cancellation reason is required" });
    }
    
    // Find and update the booking in MongoDB
    const result = await db.collection('bookings').findOneAndUpdate(
      { bookingReference: reference, status: "CONFIRMED" },
      { 
        $set: { 
          status: "CANCELLED", 
          cancelledAt: new Date(),
          cancellationReason: reason 
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      // Check if booking exists but is already cancelled
      const booking = await db.collection('bookings').findOne({ bookingReference: reference });
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.status === "CANCELLED") {
        return res.status(400).json({ error: "Booking is already cancelled" });
      }
      
      return res.status(404).json({ error: "Booking not found or cannot be cancelled" });
    }
    
    // In a real app, you would send a cancellation email here
    
    res.json({ 
      message: "Booking cancelled successfully", 
      booking: result.value 
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Update passenger details
app.put("/api/admin/bookings/:reference/passengers", async (req, res) => {
  try {
    const { reference } = req.params;
    const { passengers } = req.body;
    
    // Validate passengers data
    if (!passengers || !Array.isArray(passengers)) {
      return res.status(400).json({ error: "Invalid passenger data" });
    }
    
    // Update the booking in MongoDB
    const result = await db.collection('bookings').findOneAndUpdate(
      { bookingReference: reference },
      { $set: { passengers } },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json({ 
      message: "Passenger details updated successfully", 
      booking: result.value 
    });
  } catch (error) {
    console.error("Error updating passenger details:", error);
    res.status(500).json({ error: "Failed to update passenger details" });
  }
});

// Get all bookings with filters
app.get("/api/admin/bookings", async (req, res) => {
  try {
    const { status, from, to, date, email, lastName } = req.query;
    
    // Build query filters
    const filter = {};
    
    if (status) filter.status = status.toUpperCase();
    if (from) filter['flight.from'] = from.toUpperCase();
    if (to) filter['flight.to'] = to.toUpperCase();
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter['flight.departure'] = { $gte: startDate, $lte: endDate };
    }
    
    if (email) filter['passengers.email'] = email;
    if (lastName) filter['passengers.lastName'] = lastName;
    
    // Fetch bookings from MongoDB
    const bookings = await db.collection('bookings')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Search bookings by passenger details
app.get("/api/admin/bookings/search", async (req, res) => {
  try {
    const { email, lastName, phone } = req.query;
    
    // Build query filters
    const filter = { $or: [] };
    
    if (email) filter.$or.push({ 'passengers.email': email });
    if (lastName) filter.$or.push({ 'passengers.lastName': lastName });
    if (phone) filter.$or.push({ 'passengers.phone': phone });
    
    // If no search criteria provided
    if (filter.$or.length === 0) {
      return res.status(400).json({ error: "Please provide at least one search parameter" });
    }
    
    // Fetch bookings from MongoDB
    const bookings = await db.collection('bookings')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json(bookings);
  } catch (error) {
    console.error("Error searching bookings:", error);
    res.status(500).json({ error: "Failed to search bookings" });
  }
});

// Resend booking confirmation email
app.post("/api/admin/bookings/:reference/resend-email", async (req, res) => {
  try {
    const { reference } = req.params;
    
    // Find the booking
    const booking = await db.collection('bookings').findOne({ bookingReference: reference });
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // In a real app, you would send an email here
    // For demo purposes, we'll just pretend we did
    
    res.json({ 
      message: "Confirmation email sent successfully",
      sentTo: booking.passengers[0].email
    });
  } catch (error) {
    console.error("Error resending confirmation email:", error);
    res.status(500).json({ error: "Failed to resend confirmation email" });
  }
});

// Add this after MongoDB connection is established
async function seedSampleBookings() {
  try {
    // Check if we already have bookings
    const count = await db.collection('bookings').countDocuments();
    
    if (count === 0) {
      console.log('Seeding sample bookings...');
      
      const sampleBookings = [
        {
          bookingReference: 'SKY123456',
          status: "CONFIRMED",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          flight: {
            from: "JFK",
            to: "LAX",
            departure: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            arrival: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
            airline: "AA",
            flightNumber: "1234",
          },
          passengers: [
            {
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              phone: "+1234567890"
            }
          ],
          totalPrice: 349.99,
          currency: "USD"
        },
        {
          bookingReference: 'SKY789012',
          status: "CANCELLED",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          cancelledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          cancellationReason: "Change of plans",
          flight: {
            from: "SFO",
            to: "NYC",
            departure: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            arrival: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
            airline: "UA",
            flightNumber: "5678",
          },
          passengers: [
            {
              firstName: "Jane",
              lastName: "Smith",
              email: "jane.smith@example.com",
              phone: "+1987654321"
            },
            {
              firstName: "Bob",
              lastName: "Smith",
              email: "bob.smith@example.com",
              phone: "+1987654322"
            }
          ],
          totalPrice: 599.98,
          currency: "USD"
        },
        {
          bookingReference: 'SKY185612',
          status: "CONFIRMED",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          flight: {
            from: "LHR",
            to: "CDG",
            departure: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            arrival: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            airline: "BA",
            flightNumber: "9012",
          },
          passengers: [
            {
              firstName: "Alice",
              lastName: "Johnson",
              email: "alice.johnson@example.com",
              phone: "+4412345678"
            }
          ],
          totalPrice: 199.99,
          currency: "EUR"
        }
      ];
      
      await db.collection('bookings').insertMany(sampleBookings);
      console.log('Sample bookings seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding sample bookings:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
