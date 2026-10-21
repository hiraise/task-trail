package transaction

import "context"

type TxManager interface {
	DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error
}
