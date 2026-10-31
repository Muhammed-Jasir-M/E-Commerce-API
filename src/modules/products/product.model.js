import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be non-negative'],
      set: (v) => (v != null ? Math.round(v * 100) / 100 : v),
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price must be non-negative'],
      default: null,
      validate: {
        validator: function (value) {
          if (value == null) return true;
          return value <= this.price;
        },
        message: 'Sale price ({VALUE}) must not exceed regular price',
      },
      set: (v) => (v != null ? Math.round(v * 100) / 100 : null),
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer count',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'archived'],
        message: '{VALUE} is not a supported product status',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual field for effective price
productSchema.virtual('effectivePrice').get(function () {
  if (this.salePrice != null && this.salePrice >= 0 && this.salePrice < this.price) {
    return this.salePrice;
  }
  return this.price;
});

// Compound indexes for high-throughput filtering and sorting
productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
export default Product;
