import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysis extends Document {
  searchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topicDirections: string[];
  userConcerns: string[];
  sentimentAnalysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topicSuggestions: {
    title: string;
    angle: string;
    reason: string;
    contentOutline: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisResult {
  topicDirections: {
    direction: string;
    weight: number;
    examples: string[];
  }[];
  userConcerns: {
    concern: string;
    frequency: number;
    sentiment: string;
  }[];
  sentimentAnalysis: {
    overall: string;
    positiveRatio: number;
    negativeRatio: number;
    neutralRatio: number;
    keyEmotions: string[];
  };
  topicSuggestions: {
    topic: string;
    potential: number;
    reason: string;
  }[];
}

const analysisSchema = new Schema<IAnalysis>({
  searchId: {
    type: Schema.Types.ObjectId,
    ref: 'Search',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topicDirections: [{
    type: String,
    required: true
  }],
  userConcerns: [{
    type: String,
    required: true
  }],
  sentimentAnalysis: {
    positive: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    negative: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    neutral: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  topicSuggestions: [{
    title: {
      type: String,
      required: true
    },
    angle: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    contentOutline: [{
      type: String,
      required: true
    }]
  }]
}, {
  timestamps: true
});

export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema);