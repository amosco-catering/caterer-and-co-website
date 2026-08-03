const request = require("supertest");
const app = require("../index");

describe("Admin Auth", () => {

    test("GET /admin/login — renders login page", async () => {
        const res = await request(app).get("/admin/login");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Admin Login");
    });

    test("POST /admin/login — fails with wrong credentials", async () => {
        const res = await request(app)
            .post("/admin/login")
            .send({ email: "wrong@email.com", password: "wrongpassword" });
        expect(res.status).toBe(200);
        expect(res.text).toContain("Invalid");
    });

    test("POST /admin/login — succeeds with correct credentials", async () => {
        const res = await request(app)
            .post("/admin/login")
            .send({ 
                email: process.env.TEST_EMAIL, 
                password: process.env.TEST_PASSWORD 
            });
        expect(res.status).toBe(302); // redirect to /
        expect(res.headers.location).toBe("/");
    });

    test("GET /admin/logout — destroys session and redirects", async () => {
        const agent = request.agent(app);
        await agent
            .post("/admin/login")
            .send({ 
                email: process.env.TEST_EMAIL, 
                password: process.env.TEST_PASSWORD 
            });
        const res = await agent.get("/admin/logout");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/");
    });

    test("GET /admin/settings — redirects to login if not authenticated", async () => {
        const res = await request(app).get("/admin/settings");
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/admin/login");
    });

    test("GET /admin/settings — accessible when logged in", async () => {
        const agent = request.agent(app);
        await agent
            .post("/admin/login")
            .send({ 
                email: process.env.TEST_EMAIL, 
                password: process.env.TEST_PASSWORD 
            });
        const res = await agent.get("/admin/settings");
        expect(res.status).toBe(200);
        expect(res.text).toContain("Admin Settings");
    });

});