import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: "Users",
    },
    message: {
      type: String,
      trim: true,
    },
    file: {
      type: String,
    },
    chat : {
      type : Types.ObjectId,
      ref : "Chats"
    },
    type_file: {
      type: String,
      // enum: ["video", "image"],
    },
  },
  { timestamps: true }
);

export default model("Messages", MessageSchema);
