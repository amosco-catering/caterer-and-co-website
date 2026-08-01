const request = require("supertest");
const app = require("../index");
const supabase = require("../supabaseclient");

// Track created booking IDs for cleanup
const createdBookingIds = [];

// Helper to get a future date string (today + n days)
function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysFromNow);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Clean up all test bookings after all tests run
afterAll(async () => {
    if (createdBookingIds.length > 0) {
        await supabase
            .from("booking")
            .delete()
            .in("id", createdBookingIds);
        console.log(`Cleaned up ${createdBookingIds.length} test booking(s).`);
    }
});

describe("Booking System", () => {

    test("GET / — home page loads with calendar", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("calendar");
    });

    test("GET /booking-dates — returns array of accepted booking dates", async () => {
        const res = await request(app).get("/booking-dates");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /book — blocks booking less than 3 days in advance", async () => {
        const res = await request(app)
            .post("/book")
            .send({
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                contact_number: "09123456789",
                event_type: "Test Event",
                event_date: getFutureDate(1), // only 1 day ahead
                venue_location: "Test Venue",
                number_of_guest: 50,
                design_motif: "Test Motif",
                package: ""
            });
        expect(res.status).toBe(400);
        expect(res.text).toContain("at least 3 days in advance");
    });

    test("POST /book — successfully saves a valid booking", async () => {
        const res = await request(app)
            .post("/book")
            .send({
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                contact_number: "09123456789",
                event_type: "Test Event",
                event_date: getFutureDate(10), // 10 days ahead
                venue_location: "Test Venue",
                number_of_guest: 50,
                design_motif: "Test Motif",
                package: ""
            });

        // Should redirect to / on success
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/");

        // Fetch the booking from Supabase and track for cleanup
        const { data } = await supabase
            .from("booking")
            .select("id")
            .eq("event_date", getFutureDate(10))
            .eq("email", "test@example.com")
            .order("created_at", { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            createdBookingIds.push(data[0].id);
        }
    });

    test("POST /book — blocks duplicate booking on accepted date", async () => {
        // First insert an accepted booking directly
        const { data: inserted } = await supabase
            .from("booking")
            .insert([{
                first_name: "Existing",
                last_name: "Booking",
                email: "existing@example.com",
                contact_number: "09000000000",
                event_type: "Existing Event",
                event_date: getFutureDate(15),
                venue_location: "Existing Venue",
                number_of_guest: 100,
                design_motif: "None",
                package: "",
                status: "accepted"
            }])
            .select();

        if (inserted && inserted.length > 0) {
            createdBookingIds.push(inserted[0].id);
        }

        // Now try to book the same date
        const res = await request(app)
            .post("/book")
            .send({
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                contact_number: "09123456789",
                event_type: "Test Event",
                event_date: getFutureDate(15),
                venue_location: "Test Venue",
                number_of_guest: 50,
                design_motif: "Test Motif",
                package: ""
            });

        expect(res.status).toBe(400);
        expect(res.text).toContain("already been booked");
    });

    test("POST /book — allows booking on a pending (not accepted) date", async () => {
        // Insert a pending booking
        const { data: inserted } = await supabase
            .from("booking")
            .insert([{
                first_name: "Pending",
                last_name: "Booking",
                email: "pending@example.com",
                contact_number: "09000000000",
                event_type: "Pending Event",
                event_date: getFutureDate(20),
                venue_location: "Pending Venue",
                number_of_guest: 100,
                design_motif: "None",
                package: "",
                status: "pending"
            }])
            .select();

        if (inserted && inserted.length > 0) {
            createdBookingIds.push(inserted[0].id);
        }

        // Should still be able to book the same date
        const res = await request(app)
            .post("/book")
            .send({
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                contact_number: "09123456789",
                event_type: "Test Event",
                event_date: getFutureDate(20),
                venue_location: "Test Venue",
                number_of_guest: 50,
                design_motif: "Test Motif",
                package: ""
            });

        expect(res.status).toBe(302);

        // Track new booking for cleanup
        const { data } = await supabase
            .from("booking")
            .select("id")
            .eq("event_date", getFutureDate(20))
            .eq("email", "test@example.com")
            .order("created_at", { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            createdBookingIds.push(data[0].id);
        }
    });

});