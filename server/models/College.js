const mongoose = require("mongoose");
const slugify = require("slugify");

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    slug: { type: String, unique: true },
    address: { type: String },
    description: { type: String },
    email: { type: String },
    phone: { type: String },
    websiteUrl: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);


collegeSchema.pre("save", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("College", collegeSchema);
