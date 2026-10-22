// Package txtest — транзакция в тестах сценариев на моках (ADR-0007): сценарий выполняется
// с пометкой в контексте, и по ней видно, какие вызовы шли внутри транзакции, а какие — вне её.
package txtest

import (
	"context"
	"fmt"

	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

type key struct{}

// Expect ждёт один вызов DoWithTx и выполняет сценарий транзакции с пометкой в контексте.
func Expect(tx *mocks.MockTxManager) *gomock.Call {
	return tx.EXPECT().DoWithTx(gomock.Any(), gomock.Any()).DoAndReturn(
		func(ctx context.Context, fn func(ctx context.Context) error) error {
			return fn(context.WithValue(ctx, key{}, true))
		})
}

type matcher bool

func (m matcher) Matches(x any) bool {
	ctx, ok := x.(context.Context)
	return ok && (ctx.Value(key{}) != nil) == bool(m)
}

func (m matcher) String() string {
	return fmt.Sprintf("контекст внутри транзакции: %v", bool(m))
}

var (
	// InTx — вызов внутри транзакции.
	InTx gomock.Matcher = matcher(true)
	// OutsideTx — вызов вне транзакции: до неё или после.
	OutsideTx gomock.Matcher = matcher(false)
)
