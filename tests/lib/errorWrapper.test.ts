import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { handleError, asyncWrapper } from '../../src/lib/errorWrapper';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

describe('ErrorWrapper', () => {
    let mockRes: Partial<Response>;
    let mockReq: Partial<Request>;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis() as any,
            json: jest.fn().mockReturnThis() as any
        };

        mockReq = {
            body: {},
            params: {},
            query: {}
        };

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('handleError', () => {
        it('should classify "not found" errors as 404', () => {
            const error = new Error('Resource not found');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Resource not found',
                message: 'Resource not found'
            });
        });

        it('should classify "does not exist" errors as 404', () => {
            const error = new Error('User does not exist');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Resource not found',
                message: 'User does not exist'
            });
        });

        it('should classify "already exists" errors as 409', () => {
            const error = new Error('User already exists');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Resource already exists',
                message: 'User already exists'
            });
        });

        it('should classify "Unique constraint" errors as 409', () => {
            const error = new Error('Unique constraint failed on the fields: (email)');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Resource already exists',
                message: 'Unique constraint failed on the fields: (email)'
            });
        });

        it('should classify validation errors as 400', () => {
            const error = new Error('Validation failed: email is required');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Validation failed: email is required'
            });
        });

        it('should classify "required" errors as 400', () => {
            const error = new Error('Name field is required');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Name field is required'
            });
        });

        it('should default to 500 for unknown errors', () => {
            const error = new Error('Something went wrong');

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Something went wrong'
            });
        });

        it('should handle non-Error objects', () => {
            const error = 'String error';

            handleError(mockRes as Response, error, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Unknown error'
            });
        });

        it('should handle null/undefined errors', () => {
            handleError(mockRes as Response, null, 'Test operation');

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Unknown error'
            });
        });

        it('should log errors with context', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('Test error');

            handleError(mockRes as Response, error, 'User creation');

            expect(consoleSpy).toHaveBeenCalledWith('User creation failed:', error);
        });

        it('should use default context when not provided', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const error = new Error('Test error');

            handleError(mockRes as Response, error);

            expect(consoleSpy).toHaveBeenCalledWith('Operation failed:', error);
        });
    });

    describe('asyncWrapper', () => {
        it('should catch and handle async errors', async () => {
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockRejectedValue(new Error('Handler failed'));
            const wrappedHandler = asyncWrapper(mockHandler, 'Test handler');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Handler failed'
            });
        });

        it('should pass through successful responses', async () => {
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockResolvedValue(undefined);
            const wrappedHandler = asyncWrapper(mockHandler, 'Test handler');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('should provide error context', async () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockRejectedValue(new Error('Database connection failed'));
            const wrappedHandler = asyncWrapper(mockHandler, 'Database operation');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(consoleSpy).toHaveBeenCalledWith('Database operation failed:', expect.any(Error));
        });

        it('should handle different error types properly', async () => {
            const notFoundHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            notFoundHandler.mockRejectedValue(new Error('User not found'));
            const wrappedNotFoundHandler = asyncWrapper(notFoundHandler, 'User lookup');

            await wrappedNotFoundHandler(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Resource not found',
                message: 'User not found'
            });

            jest.clearAllMocks();
            mockRes.status = jest.fn().mockReturnThis() as any;
            mockRes.json = jest.fn().mockReturnThis() as any;

            const validationHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            validationHandler.mockRejectedValue(new Error('Email is required'));
            const wrappedValidationHandler = asyncWrapper(validationHandler, 'User creation');

            await wrappedValidationHandler(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Validation error',
                message: 'Email is required'
            });
        });

        it('should handle synchronous errors in async handlers', async () => {
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockImplementation(() => {
                throw new Error('Synchronous error');
            });
            const wrappedHandler = asyncWrapper(mockHandler, 'Sync error test');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Synchronous error'
            });
        });

        it('should preserve request and response objects', async () => {
            const testReq = {
                ...mockReq,
                body: { test: 'data' },
                params: { id: '123' }
            };

            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockResolvedValue(undefined);
            const wrappedHandler = asyncWrapper(mockHandler, 'Test context');

            await wrappedHandler(testReq as Request, mockRes as Response);

            expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
        });

        it('should work with handlers that modify response', async () => {
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockImplementation(async (req: Request, res: Response) => {
                (res.status as any)(200);
                (res.json as any)({ success: true });
            });

            const wrappedHandler = asyncWrapper(mockHandler, 'Success test');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
            expect(mockHandler).toHaveBeenCalled();
        });

        it('should handle errors thrown after response has started', async () => {
            const mockHandler = jest.fn() as jest.MockedFunction<AsyncHandler>;
            mockHandler.mockImplementation(async (req: Request, res: Response) => {
                (res.status as any)(200);
                throw new Error('Error after response started');
            });

            const wrappedHandler = asyncWrapper(mockHandler, 'Late error test');

            await wrappedHandler(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});