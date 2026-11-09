const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Gig title is required."],
            trim: true,
            minlength: [3, "Gig title must be at least 3 characters."],
            maxlength: [100, "Gig title cannot exceed 100 characters."]
        },

        description: {
            type: String,
            required: [true, "Gig description is required."],
            trim: true,
            minlength: [10, "Gig description must be at least 10 characters."],
            maxlength: [1000, "Gig description cannot exceed 1000 characters."]
        },

        category: {
            type: String,
            required: [true, "Gig category is required."],
            trim: true,
            minlength: [2, "Gig category must be at least 2 characters."],
            maxlength: [50, "Gig category cannot exceed 50 characters."]
        },

        price: {
            type: Number,
            required: [true, "Gig price is required."],
            min: [0.01, "Gig price must be greater than zero."],
            max: [1000000, "Gig price exceeds the permitted maximum."]
        },

        freelancer: {
            type: String,
            required: [true, "Freelancer ID is required."],
            index: true,
            immutable: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Gig", gigSchema);
