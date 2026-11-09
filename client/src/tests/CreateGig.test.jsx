import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateGig from "../pages/CreateGig";
import { createGig } from "../services/gigService";

vi.mock("../services/gigService", () => ({
    createGig: vi.fn()
}));

describe("CreateGig", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("displays the Create a Gig form", () => {
        render(<CreateGig />);

        expect(
            screen.getByRole("heading", { name: /create a gig/i })
        ).toBeInTheDocument();

        expect(screen.getByLabelText(/gig title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    });

    it("rejects a title shorter than 3 characters", async () => {
        const user = userEvent.setup();

        render(<CreateGig />);

        await user.type(screen.getByLabelText(/gig title/i), "Hi");

        await user.click(
            screen.getByRole("button", { name: /create gig/i })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Title must be at least 3 characters."
        );

        expect(createGig).not.toHaveBeenCalled();
    });

    it("rejects a description shorter than 10 characters", async () => {
        const user = userEvent.setup();

        render(<CreateGig />);

        await user.type(
            screen.getByLabelText(/gig title/i),
            "Logo Design"
        );

        await user.type(
            screen.getByLabelText(/description/i),
            "Short"
        );

        await user.click(
            screen.getByRole("button", { name: /create gig/i })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Description must be at least 10 characters."
        );

        expect(createGig).not.toHaveBeenCalled();
    });

    it("rejects a price that is not greater than zero", async () => {
        const user = userEvent.setup();

        render(<CreateGig />);

        await user.type(
            screen.getByLabelText(/gig title/i),
            "Logo Design"
        );

        await user.type(
            screen.getByLabelText(/description/i),
            "I will create a professional logo."
        );

        await user.type(
            screen.getByLabelText(/category/i),
            "Design"
        );

        await user.type(
            screen.getByLabelText(/price/i),
            "0"
        );

        await user.click(
            screen.getByRole("button", { name: /create gig/i })
        );

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Price must be greater than zero."
        );

        expect(createGig).not.toHaveBeenCalled();
    });

    it("submits valid gig data successfully", async () => {
        const user = userEvent.setup();

        createGig.mockResolvedValue({
            success: true
        });

        render(<CreateGig />);

        await user.type(
            screen.getByLabelText(/gig title/i),
            "Logo Design"
        );

        await user.type(
            screen.getByLabelText(/description/i),
            "I will create a professional logo."
        );

        await user.type(
            screen.getByLabelText(/category/i),
            "Design"
        );

        await user.type(
            screen.getByLabelText(/price/i),
            "500"
        );

        await user.click(
            screen.getByRole("button", { name: /create gig/i })
        );

        expect(createGig).toHaveBeenCalledWith({
            title: "Logo Design",
            description: "I will create a professional logo.",
            category: "Design",
            price: 500
        });

        expect(
            await screen.findByRole("status")
        ).toHaveTextContent("Gig created successfully.");
    });
});