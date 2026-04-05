import { pgTable, text, real, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';

export const prices = pgTable('prices', {
  timestamp: text('timestamp').primaryKey(),
  open: real('open').notNull(),
  high: real('high').notNull(),
  low: real('low').notNull(),
  close: real('close').notNull(),
});

export const zigzagPoints = pgTable('zigzag_points', {
  timestamp: text('timestamp').primaryKey(),
  price: real('price').notNull(),
  type: text('type').notNull(),
});

export const sessionVolatilities = pgTable('session_volatilities', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  date: text('date').notNull(),
  sessionName: text('session_name').notNull(),
  startTimeJst: text('start_time_jst').notNull(),
  endTimeJst: text('end_time_jst').notNull(),
  volatilityPoints: real('volatility_points').notNull(),
  hasEvent: boolean('has_event').default(false).notNull(),
  hasHighImpactEvent: boolean('has_high_impact_event').default(false).notNull(),
  eventsLinked: text('events_linked'),
}, (table) => [
  uniqueIndex('idx_session_date_name').on(table.date, table.sessionName),
]);

export const sessionThresholds = pgTable('session_thresholds', {
  sessionName: text('session_name').primaryKey(),
  smallThreshold: real('small_threshold').notNull(),
  largeThreshold: real('large_threshold').notNull(),
});

export const priceCandles = pgTable('price_candles', {
  datetimeJst: text('datetime_jst').primaryKey(),
  sessionName: text('session_name').notNull(),
  openPrice: real('open_price').notNull(),
  highPrice: real('high_price').notNull(),
  lowPrice: real('low_price').notNull(),
  closePrice: real('close_price').notNull(),
});

export const economicEvents = pgTable('economic_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  datetimeJst: text('datetime_jst').notNull(),
  eventName: text('event_name').notNull(),
  impact: text('impact'),
  actual: text('actual'),
  forecast: text('forecast'),
  previous: text('previous'),
}, (table) => [
  uniqueIndex('idx_events_name_datetime').on(table.datetimeJst, table.eventName),
]);

export const syncStatus = pgTable('sync_status', {
  id: integer('id').primaryKey().notNull(), // Should be 1 (single record)
  lastCandleAt: text('last_candle_at'),
  lastSessionAt: text('last_session_at'),
  lastEventAt: text('last_event_at'),
  totalCandles: integer('total_candles').default(0).notNull(),
  syncHealth: text('sync_health').default('Healthy').notNull(),
});

