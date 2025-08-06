package utils

func CopySlice[T any](v []*T) []*T {
	r := make([]*T, len(v))
	for i, x := range v {
		p := *x
		r[i] = &p
	}
	return r
}
