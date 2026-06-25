import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Import the reports routes
import ReportsRouter from '../routes/reports.routes.js';
app.use('/api/reports', ReportsRouter);

describe('Reports API Endpoints', () => {
    beforeAll(async () => {
        // Connect to test database if needed
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
    });

    afterAll(async () => {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    });

    describe('GET /api/reports/dashboard/summary', () => {
        it('should return dashboard summary data', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/summary')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /api/reports/sales', () => {
        it('should return sales report data', async () => {
            const response = await request(app)
                .get('/api/reports/sales')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should accept query parameters for filtering', async () => {
            const response = await request(app)
                .get('/api/reports/sales?page=1&limit=10')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/reports/purchases', () => {
        it('should return purchase report data', async () => {
            const response = await request(app)
                .get('/api/reports/purchases')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/financial', () => {
        it('should return financial report data', async () => {
            const response = await request(app)
                .get('/api/reports/financial')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/credit-debit', () => {
        it('should return credit/debit report data', async () => {
            const response = await request(app)
                .get('/api/reports/credit-debit')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/expenses', () => {
        it('should return expense report data', async () => {
            const response = await request(app)
                .get('/api/reports/expenses')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/suppliers', () => {
        it('should return supplier report data', async () => {
            const response = await request(app)
                .get('/api/reports/suppliers')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/members', () => {
        it('should return member report data', async () => {
            const response = await request(app)
                .get('/api/reports/members')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/wastage', () => {
        it('should return wastage report data', async () => {
            const response = await request(app)
                .get('/api/reports/wastage')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('GET /api/reports/activity', () => {
        it('should return activity report data', async () => {
            const response = await request(app)
                .get('/api/reports/activity')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('Dashboard Component Endpoints', () => {
        it('GET /api/reports/dashboard/top-products should return top selling products', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/top-products')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/reports/dashboard/top-customers should return top customers', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/top-customers')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/reports/dashboard/low-stock should return low stock products', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/low-stock')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/reports/dashboard/near-expiry should return near expiry products', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/near-expiry')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/reports/dashboard/recent-sales should return recent sales', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/recent-sales')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/reports/dashboard/recent-purchases should return recent purchases', async () => {
            const response = await request(app)
                .get('/api/reports/dashboard/recent-purchases')
                .expect('Content-Type', /json/);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
