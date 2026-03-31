//+------------------------------------------------------------------+
//|                                           ExportCalendar.mq5     |
//|                                  Copyright 2026, Antigravity AI  |
//|                                  Ref: OANDA Economic Indicator  |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Antigravity AI"
#property version   "1.03"
#property script_show_inputs
#property strict

input int InpYears = 1; // 取得年数

//+------------------------------------------------------------------+
//| Script program start function                                    |
//+------------------------------------------------------------------+
void OnStart()
{
   // 1. 期間の設定
   datetime timeEnd = TimeCurrent();
   datetime timeStart = timeEnd - (InpYears * 365 * 24 * 60 * 60);

   // 2. カレンダーデータの取得 (OANDAのコードに合わせ CalendarValueHistory を使用)
   MqlCalendarValue values[];
   ResetLastError();
   
   // 米国(US)の情報を取得。第4引数は国コード。
   if(!CalendarValueHistory(values, timeStart, timeEnd, "US"))
   {
      Print("Error! Failed to receive events. Code : ", GetLastError());
      return;
   }

   int total_values = ArraySize(values);
   if(total_values <= 0)
   {
      Print("カレンダーデータが0件です。");
      return;
   }

   // 3. ファイル書き出しの準備
   string filename = "USD_Calendar_" + IntegerToString(InpYears) + "Y.csv";
   int file_handle = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_ANSI, ',');
   
   if(file_handle == INVALID_HANDLE)
   {
      Print("Failed to open file. Error : ", GetLastError());
      return;
   }

   // CSVヘッダー
   FileWrite(file_handle, "Time", "EventName", "Importance", "Actual", "Forecast", "Prev");

   int count = 0;
   for(int i = 0; i < total_values; i++)
   {
      MqlCalendarEvent event;
      // イベント詳細の取得 (OANDAのコードに合わせ CalendarEventById を使用)
      if(!CalendarEventById(values[i].event_id, event)) continue;

      // 重要度の判定 (OANDA基準: 1=低, 2=中, 3=高)
      // 中(2)以上を抽出
      if(event.importance >= 2)
      {
         string impText = "";
         if(event.importance == 2) impText = "MEDIUM";
         if(event.importance == 3) impText = "HIGH";

         FileWrite(file_handle, 
            TimeToString(values[i].time, TIME_DATE|TIME_MINUTES), 
            event.name, 
            impText,
            DoubleToString(values[i].actual_value, event.digits),
            DoubleToString(values[i].forecast_value, event.digits),
            DoubleToString(values[i].prev_value, event.digits)
         );
         count++;
      }
   }

   FileClose(file_handle);
   Print("Success! Exported ", count, " events to MQL5/Files/", filename);
}
//+------------------------------------------------------------------+
