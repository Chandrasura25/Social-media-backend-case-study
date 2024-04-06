import mongoose, { Schema, Document } from 'mongoose';

export interface PostDocument extends Document {
  user: string; // User ID who created the post
  text: string;
  media?: string; // URL to attached image/video
  likes: string[]; // Array of user IDs who liked the post
  comments: {
    user: string; // User ID who commented
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const postSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  media: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<PostDocument>('Post', postSchema);

