import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import topicReducer from './slices/topicSlice';
import analysisReducer from './slices/analysisSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    topic: topicReducer,
    analysis: analysisReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;