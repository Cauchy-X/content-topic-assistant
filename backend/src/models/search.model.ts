import mongoose, { Document, Schema } from 'mongoose';

export interface ISearch extends Document {
  keyword: string;
  platforms: string[];
  userId: mongoose.Types.ObjectId;
  results: any[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const searchSchema = new Schema<ISearch>({
  keyword: {
    type: String,
    required: [true, '关键词是必需的'],
    trim: true,
    maxlength: [100, '关键词不能超过100个字符']
  },
  platforms: [{
    type: String,
    enum: ['zhihu', 'weibo', 'douyin', 'bilibili', 'xiaohongshu', 'web'],
    required: true
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  results: [{
    type: Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export const Search = mongoose.model<ISearch>('Search', searchSchema);