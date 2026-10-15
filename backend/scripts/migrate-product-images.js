const path = require("path");
const fs = require("fs");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const publicDir = path.resolve(__dirname, "../../frontend/public");

async function migrateImages() {
  const requiredVariables = [
    "MONGO_URI",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing backend .env variables: ${missingVariables.join(", ")}`
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  try {
    // Use the existing MongoDB collections directly.
    const productsCollection =
      mongoose.connection.collection("products");

    const ordersCollection =
      mongoose.connection.collection("orders");

    const products = await productsCollection.find({}).toArray();

    console.log(`Found ${products.length} products.`);

    // Maps each product ID to its final image URL.
    const imageByProductId = new Map();

    let uploadedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const product of products) {
      const currentImage = product.image;

      if (
        typeof currentImage !== "string" ||
        currentImage.trim() === ""
      ) {
        console.warn(
          `Skipping ${product.name || product._id}: no image path.`
        );
        skippedCount++;
        continue;
      }

      // Already-hosted images do not need uploading.
      if (/^https?:\/\//i.test(currentImage)) {
        imageByProductId.set(
          String(product._id),
          currentImage
        );

        console.log(
          `Already hosted: ${product.name || product._id}`
        );
        skippedCount++;
        continue;
      }

      // Convert paths such as /keyboard.jpg to keyboard.jpg.
      const filename = currentImage
        .split("?")[0]
        .replace(/\\/g, "/")
        .split("/")
        .pop();

      const localImagePath = path.join(publicDir, filename);

      if (!fs.existsSync(localImagePath)) {
        console.warn(
          `Local image not found for ${product.name || product._id}: ` +
            localImagePath
        );
        failedCount++;
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(
          localImagePath,
          {
            folder: "shopkart/products",
            public_id: String(product._id),
            overwrite: true,
            resource_type: "image",
          }
        );

        // Save the HTTPS Cloudinary URL in the existing Product record.
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { image: result.secure_url } }
        );

        imageByProductId.set(
          String(product._id),
          result.secure_url
        );

        uploadedCount++;

        console.log(
          `Uploaded: ${product.name || product._id}`
        );
      } catch (error) {
        failedCount++;
        console.error(
          `Upload failed for ${product.name || product._id}:`,
          error.message
        );
      }
    }

    // Update historical order snapshots so they use hosted image URLs too.
    const orders = await ordersCollection.find({}).toArray();
    let updatedOrdersCount = 0;

    for (const order of orders) {
      if (!Array.isArray(order.items)) {
        continue;
      }

      let orderChanged = false;

      const updatedItems = order.items.map((item) => {
        const productReference =
          item.product && item.product._id
            ? item.product._id
            : item.product;

        const hostedImage = imageByProductId.get(
          String(productReference)
        );

        if (!hostedImage || item.image === hostedImage) {
          return item;
        }

        orderChanged = true;

        return {
          ...item,
          image: hostedImage,
        };
      });

      if (orderChanged) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { items: updatedItems } }
        );

        updatedOrdersCount++;
      }
    }

    console.log("\n========== Migration Summary ==========");
    console.log(`New images uploaded: ${uploadedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Images needing attention: ${failedCount}`);
    console.log(`Historical orders updated: ${updatedOrdersCount}`);
    console.log("=======================================\n");

    if (failedCount > 0) {
      console.log(
        "Some images need attention. Read the warnings above before proceeding."
      );
    } else {
      console.log("Image migration finished successfully.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

migrateImages().catch((error) => {
  console.error("Migration stopped:", error.message);
  process.exitCode = 1;
});