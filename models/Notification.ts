import mongoose, { Schema, Document } from 'mongoose';

export interface NotificationDocument extends Document {
  recipient: string; // Recipient user ID
  type: 'mention' | 'like' | 'comment'; // Type of notification
  postId?: string; // ID of the relevant post (for likes/comments)
  commentId?: string; // ID of the relevant comment (for comments)
  read: boolean; // Indicates whether the notification has been read
  createdAt: Date;
}

const notificationSchema: Schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['mention', 'like', 'comment'], required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post' },
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<NotificationDocument>('Notification', notificationSchema);
