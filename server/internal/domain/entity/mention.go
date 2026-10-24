package entity

import (
	"regexp"
	"strings"
)

// mentionToken — @[Name](user UUID) in a comment (ADR-0039). The UUID part is strict: a loose
// pattern would let 36 dashes reach a uuid[] query and fail the request.
var mentionToken = regexp.MustCompile(`@\[([^\]\n]{1,100})\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)`)

// ParseMentions returns the users mentioned in the text, lower-cased, without duplicates, in order of
// first appearance.
func ParseMentions(text string) []UserID {
	var ids []UserID
	seen := map[UserID]bool{}
	for _, m := range mentionToken.FindAllStringSubmatch(text, -1) {
		id := UserID(strings.ToLower(m[2]))
		if seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
	}
	return ids
}

// MentionsAdded — users mentioned in after but not in before (an edit notifies only them).
func MentionsAdded(before, after string) []UserID {
	had := map[UserID]bool{}
	for _, id := range ParseMentions(before) {
		had[id] = true
	}
	var added []UserID
	for _, id := range ParseMentions(after) {
		if !had[id] {
			added = append(added, id)
		}
	}
	return added
}
