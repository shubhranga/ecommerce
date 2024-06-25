const { default: mongoose } = require("mongoose");

const dbConnect = () => {
  try {
    const conn = mongoose.connect(
      "mongodb+srv://shubhamranga30:mansigoel@cluster0.xd9kj8j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("DataBase error");
  }
};

module.exports = dbConnect;
