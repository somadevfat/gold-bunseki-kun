from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(
    title="Gold Volatility Analytics API",
    description="Go言語から価格データを受け取り、ZigZagなどの重い計算を代行するサーバーです。"
)

# --- モデル定義（Goの構造体と同じように型を厳密に定めます） ---

class PriceData(BaseModel):
    timestamp: str
    high: float
    low: float

class ZigZagRequest(BaseModel):
    prices: List[PriceData]
    threshold: float = 0.5  # エッジ（波の転換）を判定する閾値（例: 0.5%）

# --- エンドポイント定義 ---

@app.get("/health")
def health_check():
    """
    Go言語側から、「Pythonサーバーが生きているか」を確認するためのエンドポイントです。
    """
    return {"status": "ok", "message": "Analytics engine is running."}

@app.post("/zigzag/calculate")
def calculate_zigzag(payload: ZigZagRequest):
    """
    Go言語から数十〜数百件の価格（Price）を受け取り、
    波の頂点と底（ZigZagPoint）だけを抽出して配列で返すエンドポイント（仮実装）です。
    """
    
    # TODO: ここに pandas を使った計算を書く
    # 今は「GO言語から送られてきものの最初をHIGH、最後をLOW」として返す仮実装
    points = []
    if len(payload.prices) >= 2:
        points.append({
            "timestamp": payload.prices[0].timestamp,
            "price": payload.prices[0].high,
            "type": "HIGH"
        })
        points.append({
            "timestamp": payload.prices[-1].timestamp,
            "price": payload.prices[-1].low,
            "type": "LOW"
        })
    
    return {
        "points": points
    }

if __name__ == "__main__":
    import uvicorn
    # 開発用に起動（Goの8080ポートと被らないように 8000 で立ち上げます）
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
