import { EventEmitter } from "events";
import { inFlightRequestMiddleware } from "./inFlightRequest.middleware.js";

function createResponse() {
    const response = new EventEmitter();
    response.statusCode = 200;
    response.status = jest.fn((statusCode) => {
        response.statusCode = statusCode;
        return response;
    });
    response.json = jest.fn(() => response);
    return response;
}

function createRequest({ method = "POST", body = {}, url = "/api/test", headers = {} } = {}) {
    return {
        method,
        body,
        url,
        originalUrl: url,
        get: (name) => headers[name.toLowerCase()] || headers[name],
    };
}

describe("inFlightRequestMiddleware", () => {
    test("rejects a duplicate mutation while the matching request is still running", () => {
        const request = createRequest();
        const firstResponse = createResponse();
        const firstNext = jest.fn();

        inFlightRequestMiddleware(request, firstResponse, firstNext);

        const duplicateResponse = createResponse();
        const duplicateNext = jest.fn();
        inFlightRequestMiddleware(createRequest(), duplicateResponse, duplicateNext);

        expect(firstNext).toHaveBeenCalledTimes(1);
        expect(duplicateNext).not.toHaveBeenCalled();
        expect(duplicateResponse.status).toHaveBeenCalledWith(409);
        expect(duplicateResponse.json).toHaveBeenCalledWith({
            success: false,
            message: "This request is already in progress. Please wait.",
        });

        firstResponse.emit("finish");
        const retryNext = jest.fn();
        inFlightRequestMiddleware(createRequest(), createResponse(), retryNext);
        expect(retryNext).toHaveBeenCalledTimes(1);
    });

    test("does not block read-only requests", () => {
        const next = jest.fn();
        inFlightRequestMiddleware(
            createRequest({ method: "GET" }),
            createResponse(),
            next
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("does not block different mutation payloads", () => {
        const firstNext = jest.fn();
        const firstResponse = createResponse();
        inFlightRequestMiddleware(
            createRequest({ body: { value: 1 } }),
            firstResponse,
            firstNext
        );

        const secondNext = jest.fn();
        inFlightRequestMiddleware(
            createRequest({ body: { value: 2 } }),
            createResponse(),
            secondNext
        );

        expect(firstNext).toHaveBeenCalledTimes(1);
        expect(secondNext).toHaveBeenCalledTimes(1);
        firstResponse.emit("finish");
    });

    test("treats multipart requests with different boundaries as the same in-flight upload", () => {
        const firstNext = jest.fn();
        const firstResponse = createResponse();
        inFlightRequestMiddleware(
            createRequest({
                body: undefined,
                headers: {
                    "content-type": "multipart/form-data; boundary=first",
                    "content-length": "2048",
                },
            }),
            firstResponse,
            firstNext
        );

        const secondNext = jest.fn();
        const secondResponse = createResponse();
        inFlightRequestMiddleware(
            createRequest({
                body: undefined,
                headers: {
                    "content-type": "multipart/form-data; boundary=second",
                    "content-length": "2048",
                },
            }),
            secondResponse,
            secondNext
        );

        expect(firstNext).toHaveBeenCalledTimes(1);
        expect(secondNext).not.toHaveBeenCalled();
        expect(secondResponse.status).toHaveBeenCalledWith(409);
        firstResponse.emit("finish");
    });
});
