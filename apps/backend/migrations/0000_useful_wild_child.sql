CREATE TABLE "economic_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "economic_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime_jst" text NOT NULL,
	"event_name" text NOT NULL,
	"impact" text,
	"actual" text,
	"forecast" text,
	"previous" text
);
--> statement-breakpoint
CREATE TABLE "price_candles" (
	"datetime_jst" text PRIMARY KEY NOT NULL,
	"session_name" text NOT NULL,
	"open_price" real NOT NULL,
	"high_price" real NOT NULL,
	"low_price" real NOT NULL,
	"close_price" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"timestamp" text PRIMARY KEY NOT NULL,
	"open" real NOT NULL,
	"high" real NOT NULL,
	"low" real NOT NULL,
	"close" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_thresholds" (
	"session_name" text PRIMARY KEY NOT NULL,
	"small_threshold" real NOT NULL,
	"large_threshold" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_volatilities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "session_volatilities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" text NOT NULL,
	"session_name" text NOT NULL,
	"start_time_jst" text NOT NULL,
	"end_time_jst" text NOT NULL,
	"volatility_points" real NOT NULL,
	"has_event" boolean DEFAULT false NOT NULL,
	"has_high_impact_event" boolean DEFAULT false NOT NULL,
	"events_linked" text
);
--> statement-breakpoint
CREATE TABLE "zigzag_points" (
	"timestamp" text PRIMARY KEY NOT NULL,
	"price" real NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_events_name_datetime" ON "economic_events" USING btree ("datetime_jst","event_name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_session_date_name" ON "session_volatilities" USING btree ("date","session_name");