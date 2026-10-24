package entity_test

import (
	"reflect"
	"strings"
	"testing"

	"task-trail/internal/domain/entity"
)

const (
	annaID = "0b5e1c1e-4f0a-4c39-9a57-1d2b3c4d5e6f"
	ivanID = "7f3a9d20-1c2b-4e5f-8a9b-0c1d2e3f4a5b"
)

// Tokens give the users in order of first appearance, lower-cased, once each (ADR-0039).
func TestParseMentions(t *testing.T) {
	text := "@[Анна](" + annaID + ") и @[Иван](" + strings.ToUpper(ivanID) + "), снова @[Аня](" + annaID + ")"
	want := []entity.UserID{annaID, ivanID}
	if got := entity.ParseMentions(text); !reflect.DeepEqual(got, want) {
		t.Errorf("ParseMentions = %v, want %v", got, want)
	}
}

// A broken token is plain text, not a mention.
func TestParseMentionsIgnoresBrokenTokens(t *testing.T) {
	for name, text := range map[string]string{
		"dashes in place of a UUID": "@[Анна](" + strings.Repeat("-", 36) + ")",
		"not a UUID":                "@[Анна](x)",
		"line break in the name":    "@[Ан\nна](" + annaID + ")",
		"101-character name":        "@[" + strings.Repeat("я", 101) + "](" + annaID + ")",
		"empty name":                "@[](" + annaID + ")",
		"no @":                      "[Анна](" + annaID + ")",
	} {
		if got := entity.ParseMentions(text); got != nil {
			t.Errorf("%s: ParseMentions = %v, want none", name, got)
		}
	}
	name := strings.Repeat("я", 100)
	if got := entity.ParseMentions("@[" + name + "](" + annaID + ")"); len(got) != 1 {
		t.Errorf("a 100-character name: ParseMentions = %v, want one", got)
	}
}

// An edit notifies only the users it adds.
func TestMentionsAdded(t *testing.T) {
	before := "@[Анна](" + annaID + ")"
	after := "@[Анна](" + strings.ToUpper(annaID) + ") @[Иван](" + ivanID + ")"
	if got := entity.MentionsAdded(before, after); !reflect.DeepEqual(got, []entity.UserID{ivanID}) {
		t.Errorf("MentionsAdded = %v, want [%s]", got, ivanID)
	}
	if got := entity.MentionsAdded(after, before); got != nil {
		t.Errorf("MentionsAdded of a removal = %v, want none", got)
	}
}

// A notification shows a token as "@Name".
func TestCommentExcerptMention(t *testing.T) {
	if got := entity.CommentExcerpt("Посмотри,\n@[Анна Петрова](" + annaID + ")"); got != "Посмотри, @Анна Петрова" {
		t.Errorf("CommentExcerpt = %q", got)
	}
}
