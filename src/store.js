import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import roleReducer from './slices/roleSlice';
import { shiftScheduleReducer } from "./slices/ShiftScheduleSlice";
import { jobGradeReducer } from './slices/JobGradeSlice';
import { contractReducer } from './slices/ContractSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    role: roleReducer,
    shiftSchedule: shiftScheduleReducer,
    jobGrade: jobGradeReducer,
    contract: contractReducer,
  },
});