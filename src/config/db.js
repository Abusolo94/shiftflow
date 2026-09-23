// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const connection = await mongoose.connect(
//       process.env.MONGODB_URI
//     );

//     console.log(
//       `MongoDB connected: ${connection.connection.host}`
//     );
//   } catch (error) {
//     console.error(
//       "MongoDB connection failed:",
//       error.message
//     );

//     process.exit(1);
//   }
// };

// export default connectDB;


import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  // Already connected
  if (cached.conn) {
    console.log("MongoDB: using existing connection");
    return cached.conn;
  }

  // Make sure URI exists
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is not configured."
    );
  }

  try {
    // Create connection only once
    if (!cached.promise) {
      console.log("MongoDB: creating new connection...");

      cached.promise = mongoose.connect(
        process.env.MONGODB_URI,
        {
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
        }
      );
    }

    cached.conn = await cached.promise;

    console.log(
      `MongoDB connected: ${cached.conn.connection.host}`
    );

    return cached.conn;
  } catch (error) {
    // Allow another attempt on next request
    cached.promise = null;
    cached.conn = null;

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

export default connectDB;