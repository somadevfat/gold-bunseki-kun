package use_case

import (
	"context"

	"gold-vola-bunseki/backend/internal/application/port"
	"gold-vola-bunseki/backend/internal/domain"
)

/*
 * FetchPriceUseCase は最新の価格を取得・検証するユースケース（シナリオ）です。
 * @responsibility: 価格リポジトリ（外部API）からデータを取得し、ドメインのバリデーションを実行する。
 */
type FetchPriceUseCase struct {
	priceRepo port.PriceRepository
}

/*
 * NewFetchPriceUseCase はユースケースの生成関数（コンストラクタ）です。
 * @responsibility: インターフェースであるPriceRepositoryを注入（DI）し、ユースケースを生成する。
 * @param: repo 注入するPriceRepositoryの実装
 * @return: *FetchPriceUseCase ユースケースへのポインタ
 */
func NewFetchPriceUseCase(repo port.PriceRepository) *FetchPriceUseCase {
	return &FetchPriceUseCase{
		priceRepo: repo,
	}
}

/*
 * Execute は価格取得シナリオの本体です。
 * @responsibility: リポジトリから価格を引き出し、ドメインのValidateメソッドで整合性をチェックして返す。
 * @param: ctx リクエストの文脈（とりあえずのおまじないとして渡す）
 * @return: 取得・検証済みのPriceRecord, エラー
 */
func (uc *FetchPriceUseCase) Execute(ctx context.Context) (*domain.PriceRecord, error) {
	// 1. リポジトリ（ポート）を通じて外部から最新価格を取得
	// （※この「ctx」をそのまま引数としてリレー渡しします！）
	price, err := uc.priceRepo.FetchLatest(ctx)
	if err != nil {
		// Javaのthrowの代わりに、自分でerrorを返す泥臭いやり方です
		return nil, err
	}

	// 2. 取得したデータが正しいか「ドメインエンティティのルール」で検証
	if err := price.Validate(); err != nil {
		// 高値が安値を下回っているなどのドメインルール違反があった場合
		return nil, err
	}

	// 3. 成功したら価格データを返す
	return price, nil
}
