import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    minPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    /* Default min price if subcategory not selected */
    minPrice: {
      type: Number,
      required: true,
      min: 0
    },

    /* Subcategories with their own pricing */
    subCategories: {
      type: [subCategorySchema],
      default: []
    },

    /* Optional icon name for UI display */
    icon: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
