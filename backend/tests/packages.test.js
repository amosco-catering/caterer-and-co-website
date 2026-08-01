const request = require("supertest");
const app = require("../index");
const supabase = require("../supabaseclient");

// Track created package IDs for cleanup
const createdPackageIds = [];

// Authenticated agent (logged in as test admin)
let agent;

beforeAll(async () => {
    agent = request.agent(app);
    await agent
        .post("/admin/login")
        .send({ email: "test@email.com", password: "password" });
});

afterAll(async () => {
    if (createdPackageIds.length > 0) {
        await supabase
            .from("packages")
            .delete()
            .in("id", createdPackageIds);
        console.log(`Cleaned up ${createdPackageIds.length} test package(s).`);
    }
});

describe("Package Manager", () => {

    test("GET / — packages section renders on home page", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Rates");
    });

    test("GET /admin/packages — blocked for non-admin", async () => {
        const res = await request(app).get("/admin/packages");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("GET /admin/packages — admin can view all packages", async () => {
        const res = await agent.get("/admin/packages");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("POST /admin/packages — blocked for non-admin", async () => {
        const res = await request(app)
            .post("/admin/packages")
            .send({
                package_title: "Unauthorized Package",
                package_contents: "Item 1",
                venue_styling: "Style 1",
                rate100: 900,
                rate75: 1100,
                rate50: 1250,
                note: "Test note"
            });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("POST /admin/packages — admin can create a package", async () => {
        const res = await agent
            .post("/admin/packages")
            .send({
                package_title: "Test Package",
                package_contents: "Item 1\nItem 2\nItem 3",
                venue_styling: "Style 1\nStyle 2",
                rate100: 900,
                rate75: 1100,
                rate50: 1250,
                note: "Test note"
            });

        // Redirects to /admin/settings on success
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/settings");

        // Fetch the created package and track for cleanup
        const { data } = await supabase
            .from("packages")
            .select("id")
            .eq("package_title", "Test Package")
            .order("id", { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            createdPackageIds.push(data[0].id);
        }
    });

    test("POST /admin/packages — package_contents are saved as array", async () => {
        const { data } = await supabase
            .from("packages")
            .select("package_contents")
            .eq("package_title", "Test Package")
            .order("id", { ascending: false })
            .limit(1);

        expect(Array.isArray(data[0].package_contents)).toBe(true);
        expect(data[0].package_contents).toContain("Item 1");
        expect(data[0].package_contents).toContain("Item 2");
        expect(data[0].package_contents).toContain("Item 3");
    });

    test("POST /admin/packages — rates are saved correctly", async () => {
        const { data } = await supabase
            .from("packages")
            .select("rates")
            .eq("package_title", "Test Package")
            .order("id", { ascending: false })
            .limit(1);

        expect(Array.isArray(data[0].rates)).toBe(true);
        expect(data[0].rates[0]).toEqual({ guests: 100, price: 900 });
        expect(data[0].rates[1]).toEqual({ guests: 75, price: 1100 });
        expect(data[0].rates[2]).toEqual({ guests: 50, price: 1250 });
    });

    test("POST /admin/packages/:id — admin can update a package", async () => {
        const packageId = createdPackageIds[0];

        const res = await agent
            .post(`/admin/packages/${packageId}`)
            .send({
                package_title: "Updated Test Package",
                package_contents: "Updated Item 1\nUpdated Item 2",
                venue_styling: "Updated Style 1",
                rate100: 1000,
                rate75: 1200,
                rate50: 1400,
                note: "Updated note"
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/settings");

        // Verify update in DB
        const { data } = await supabase
            .from("packages")
            .select("package_title, rates")
            .eq("id", packageId)
            .single();

        expect(data.package_title).toBe("Updated Test Package");
        expect(data.rates[0].price).toBe(1000);
    });

    test("POST /admin/packages/:id — blocked for non-admin", async () => {
        const res = await request(app)
            .post(`/admin/packages/999`)
            .send({
                package_title: "Hacked Package",
                package_contents: "Hacked",
                venue_styling: "Hacked",
                rate100: 0,
                rate75: 0,
                rate50: 0
            });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("POST /admin/packages/:id/delete — admin can delete a package", async () => {
        // Create a package to delete
        await agent
            .post("/admin/packages")
            .send({
                package_title: "Package To Delete",
                package_contents: "Item 1",
                venue_styling: "Style 1",
                rate100: 900,
                rate75: 1100,
                rate50: 1250,
                note: ""
            });

        // Fetch its ID
        const { data } = await supabase
            .from("packages")
            .select("id")
            .eq("package_title", "Package To Delete")
            .order("id", { ascending: false })
            .limit(1);

        const deleteId = data[0].id;

        const res = await agent
            .post(`/admin/packages/${deleteId}/delete`);

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/settings");

        // Verify it's gone from DB
        const { data: check } = await supabase
            .from("packages")
            .select("id")
            .eq("id", deleteId);

        expect(check.length).toBe(0);
    });

    test("POST /admin/packages/:id/delete — blocked for non-admin", async () => {
        const res = await request(app)
            .post(`/admin/packages/999/delete`);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

});