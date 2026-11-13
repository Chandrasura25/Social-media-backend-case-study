import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType = 'mention' | 'like' | 'comment' | 'follow';

export interface NotificationDocument extends Document {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  type: NotificationType;
  postId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['mention', 'like', 'comment', 'follow'], required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<NotificationDocument>('Notification', notificationSchema);
