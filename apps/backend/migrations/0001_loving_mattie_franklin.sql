CREATE TABLE "sync_status" (
	"id" integer PRIMARY KEY NOT NULL,
	"last_candle_at" text,
	"last_session_at" text,
	"last_event_at" text,
	"total_candles" integer DEFAULT 0 NOT NULL,
	"sync_health" text DEFAULT 'Healthy' NOT NULL
);
