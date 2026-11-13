import mongoose, { Document, Schema, Types } from 'mongoose';

export interface Comment {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface PostDocument extends Document {
  user: Types.ObjectId;
  text: string;
  media?: string;
  likes: Types.ObjectId[];
  comments: Types.DocumentArray<Comment & Types.Subdocument>;
  mentionedUsers: Types.ObjectId[];
  createdAt: Date;
}

const postSchema = new Schema<PostDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, trim: true, maxlength: 2000, default: '' },
    media: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    mentionedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

// Feed query: posts by followed users, newest first
postSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<PostDocument>('Post', postSchema);
