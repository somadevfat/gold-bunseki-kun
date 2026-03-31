//+------------------------------------------------------------------+
//|                                              ExportZigZag.mq5    |
//|                                  Copyright 2026, Antigravity AI  |
//|                                             https://github.com/  |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Antigravity AI"
#property link      "https://github.com/"
#property version   "1.00"
#property script_show_inputs

//--- input parameters
input int      InpDepth     = 12;    // ZigZag Depth
input int      InpDeviation = 5;     // ZigZag Deviation
input int      InpBackstep  = 3;     // ZigZag Backstep
input int      InpYears     = 1;     // Export Years

//+------------------------------------------------------------------+
//| Script program start function                                    |
//+------------------------------------------------------------------+
void OnStart()
{
   string symbol = _Symbol;
   ENUM_TIMEFRAMES period = _Period;
   
   // ZigZagインジケータのハンドル取得 (標準のExamples\\ZigZagを使用)
   int handle = iCustom(symbol, period, "Examples\\ZigZag", InpDepth, InpDeviation, InpBackstep);
   
   if(handle == INVALID_HANDLE)
   {
      Print("Failed to get ZigZag handle. Error: ", GetLastError());
      return;
   }

   // 期間の設定（5年前から現在まで）
   datetime end_time = TimeCurrent();
   datetime start_time = end_time - (InpYears * 365 * 24 * 60 * 60);
   
   // バーの総数を取得
   int total_bars = iBarShift(symbol, period, start_time);
   if(total_bars <= 0) total_bars = iBars(symbol, period);

   Print("Exporting data for approximately ", total_bars, " bars...");

   // ファイルオープン
   string filename = symbol + "_ZigZag_" + IntegerToString(InpYears) + "Y.csv";
   int file_handle = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_ANSI, ',');
   
   if(file_handle == INVALID_HANDLE)
   {
      Print("Failed to open file. Error: ", GetLastError());
      return;
   }

   // ヘッダー書き込み
   FileWrite(file_handle, "Time", "Price", "Type");

   // バッファのコピー用
   double zz_buffer[]; // 0: ZigZag
   double high_buffer[]; // 1: Highs
   double low_buffer[];  // 2: Lows
   
   ArraySetAsSeries(zz_buffer, true);
   ArraySetAsSeries(high_buffer, true);
   ArraySetAsSeries(low_buffer, true);

   // データの抽出（過去から現在へ）
   int count = 0;
   for(int i = total_bars; i >= 0; i--)
   {
      // 1本ずつだと遅いので、実際にはもっと効率化できますが、確実性を優先
      if(CopyBuffer(handle, 1, i, 1, high_buffer) > 0 && high_buffer[0] != 0 && high_buffer[0] != EMPTY_VALUE)
      {
         FileWrite(file_handle, TimeToString(iTime(symbol, period, i)), DoubleToString(high_buffer[0], _Digits), "High");
         count++;
      }
      else if(CopyBuffer(handle, 2, i, 1, low_buffer) > 0 && low_buffer[0] != 0 && low_buffer[0] != EMPTY_VALUE)
      {
         FileWrite(file_handle, TimeToString(iTime(symbol, period, i)), DoubleToString(low_buffer[0], _Digits), "Low");
         count++;
      }
   }

   FileClose(file_handle);
   IndicatorRelease(handle);

   Print("Success! Exported ", count, " ZigZag points to ", filename);
   Print("File location: MT5 -> File -> Open Data Folder -> MQL5/Files");
}
//+------------------------------------------------------------------+
