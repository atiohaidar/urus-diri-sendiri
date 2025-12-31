// Main Storage Entry Point
// This file aggregates the modular storage logic.

import { registerListener } from './storage-modules/core';
import { updateDailySnapshot } from './storage-modules/snapshot';

// Wire up the daily snapshot listener to core events
registerListener(updateDailySnapshot);

// Forward types and utils
export * from './types';
export * from './time-utils';

// Helper re-exports (excluding conflict with storage/routines)
export {
  isRoutineCompletedToday,
  checkOverlap,
  findCurrentRoutineIndex,
  parseScheduleText,
  getCompletionStats
} from './routine-helpers';

// Storage Modules
export * from './storage-modules/core';
export * from './storage-modules/priorities';
export * from './storage-modules/reflections';
export * from './storage-modules/notes';
export * from './storage-modules/routines'; // Contains stateful toggleRoutineCompletion
export * from './storage-modules/logs';
export * from './storage-modules/cloud';
export * from './storage-modules/snapshot';
