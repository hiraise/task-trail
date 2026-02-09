package utils

func CopySlice[T any](v []*T) []*T {
	r := make([]*T, len(v))
	for i, x := range v {
		p := *x
		r[i] = &p
	}
	return r
}

func CopyMap[K comparable, T any](v map[K]*T) map[K]*T {
	r := make(map[K]*T, len(v))
	for k, x := range v {
		p := *x
		r[k] = &p
	}
	return r
}
