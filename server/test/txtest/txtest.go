// Package txtest is the transaction in mock-based scenario tests (ADR-0007): the scenario runs
// with a mark in the context, which shows which calls ran inside the transaction and which outside it.
package txtest

import (
	"context"
	"fmt"

	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

type key struct{}

// Expect expects one DoWithTx call and runs the transaction scenario with a mark in the context.
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
	return fmt.Sprintf("context inside a transaction: %v", bool(m))
}

var (
	// InTx is a call inside the transaction.
	InTx gomock.Matcher = matcher(true)
	// OutsideTx is a call outside the transaction: before or after it.
	OutsideTx gomock.Matcher = matcher(false)
)
