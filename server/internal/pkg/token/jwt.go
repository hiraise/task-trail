package token

import (
	"fmt"
	"strconv"
	"task-trail/internal/pkg/uuid"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Token struct {
	Token string
	Exp   time.Time
	Jti   string
}

type Service interface {
	// Generate access token by user id
	GenAccessToken(userId int) (*Token, error)
	// Generate refresh token and jti by user id
	GenRefreshToken(userId int) (*Token, error)
	VerifyAccessToken(token string) (int, error)
	VerifyRefreshToken(token string) error
}

type JWTService struct {
	acSecret   []byte
	acLifetime time.Duration
	rtSecret   []byte
	rtLifetime time.Duration
	iss        string
	uuidGen    uuid.Generator
}

func NewJwtService(
	accessTokenSecret string,
	accessTokenLifetimeMin int,
	refreshTokenSecret string,
	refreshTokenLifetimeMin int,
	tokenIssuer string,
	uuidGenerator uuid.Generator,
) *JWTService {
	return &JWTService{
		acSecret:   []byte(accessTokenSecret),
		acLifetime: time.Duration(accessTokenLifetimeMin),
		rtSecret:   []byte(refreshTokenSecret),
		rtLifetime: time.Duration(refreshTokenLifetimeMin),
		iss:        tokenIssuer,
		uuidGen:    uuidGenerator,
	}
}

func (s *JWTService) GenAccessToken(userId int) (*Token, error) {
	exp := time.Now().Add(time.Minute * s.acLifetime)
	claims := jwt.MapClaims{
		"sub": strconv.Itoa(userId),
		"exp": exp.Unix(),
		"iss": s.iss,
	}
	token, err := s.genToken(claims)
	if err != nil {
		return &Token{}, err
	}
	return &Token{Token: token, Exp: exp}, nil
}

func (s *JWTService) GenRefreshToken(userId int) (*Token, error) {
	jti := s.uuidGen.Generate()
	exp := time.Now().Add(time.Minute * s.rtLifetime)
	claims := jwt.MapClaims{
		"sub": strconv.Itoa(userId),
		"exp": exp.Unix(),
		"jti": jti,
		"iss": s.iss,
	}
	token, err := s.genToken(claims)
	if err != nil {
		return &Token{}, err
	}
	return &Token{Token: token, Exp: exp, Jti: jti}, nil

}

func (s *JWTService) genToken(claims jwt.Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.acSecret)
}

func (s *JWTService) VerifyAccessToken(token string) (int, error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return s.acSecret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return 0, err
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("claims are invalid, claims: %v", claims)
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return 0, fmt.Errorf("sub is not a string, sub: %v", sub)
	}
	v, err := strconv.Atoi(sub)
	if err != nil {
		return 0, fmt.Errorf("sub is not an int, sub: %v", sub)
	}
	return v, nil
}
func (s *JWTService) VerifyRefreshToken(token string) error {
	return nil
}
