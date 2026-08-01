const request = require("supertest");
const app = require("../index");
const supabase = require("../supabaseclient");

// Track created portfolio IDs for cleanup
const createdPortfolioIds = [];

// Authenticated agent (logged in as test admin)
let agent;

beforeAll(async () => {
    agent = request.agent(app);
    await agent
        .post("/admin/login")
        .send({ email: "test@email.com", password: "password" });
});

afterAll(async () => {
    if (createdPortfolioIds.length > 0) {
        // Delete images first
        await supabase
            .from("portfolio_images")
            .delete()
            .in("portfolio_id", createdPortfolioIds);

        // Then delete portfolio items
        await supabase
            .from("portfolio")
            .delete()
            .in("id", createdPortfolioIds);

        console.log(`Cleaned up ${createdPortfolioIds.length} test portfolio item(s).`);
    }
});

describe("Portfolio Manager", () => {

    test("GET / — portfolio section renders on home page", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toContain("View Portfolio");
    });

    test("POST /portfolio — blocked for non-admin", async () => {
        const res = await request(app)
            .post("/portfolio")
            .field("title", "Unauthorized Portfolio")
            .field("description", "Should not be created");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("POST /portfolio — admin can create a portfolio item", async () => {
        const res = await agent
            .post("/portfolio")
            .field("title", "Test Portfolio Item")
            .field("description", "Test Description");

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        // Track for cleanup
        if (res.body.data && res.body.data.id) {
            createdPortfolioIds.push(res.body.data.id);
        }
    });

    test("POST /portfolio — fails without title or description", async () => {
        const res = await agent
            .post("/portfolio")
            .field("title", "")
            .field("description", "");
        expect(res.status).toBe(400);
        expect(res.body.error).toContain("required");
    });

    test("GET /portfolio/:id — renders portfolio detail page", async () => {
        // Create a portfolio item first
        const createRes = await agent
            .post("/portfolio")
            .field("title", "Detail Test Portfolio")
            .field("description", "Detail Test Description");

        const portfolioId = createRes.body.data.id;
        createdPortfolioIds.push(portfolioId);

        const res = await request(app).get(`/portfolio/${portfolioId}`);
        expect(res.status).toBe(200);
        expect(res.text).toContain("Detail Test Portfolio");
    });

    test("PUT /portfolio/:id — admin can update a portfolio item", async () => {
        // Create a portfolio item first
        const createRes = await agent
            .post("/portfolio")
            .field("title", "Update Test Portfolio")
            .field("description", "Original Description");

        const portfolioId = createRes.body.data.id;
        createdPortfolioIds.push(portfolioId);

        const res = await agent
            .put(`/portfolio/${portfolioId}`)
            .send({ title: "Updated Title", description: "Updated Description" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("PUT /portfolio/:id — blocked for non-admin", async () => {
        const res = await request(app)
            .put(`/portfolio/999`)
            .send({ title: "Hacked", description: "Hacked" });
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("DELETE /portfolio/:id — admin can delete a portfolio item", async () => {
        // Create a portfolio item to delete
        const createRes = await agent
            .post("/portfolio")
            .field("title", "Delete Test Portfolio")
            .field("description", "To be deleted");

        const portfolioId = createRes.body.data.id;

        const res = await agent.delete(`/portfolio/${portfolioId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Don't add to cleanup since it's already deleted
    });

    test("DELETE /portfolio/:id — blocked for non-admin", async () => {
        const res = await request(app).delete(`/portfolio/999`);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("GET /portfolio/:id — returns 404 for non-existent item", async () => {
        const res = await request(app).get("/portfolio/999999");
        expect(res.status).toBe(404);
    });

});