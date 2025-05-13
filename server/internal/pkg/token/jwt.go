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
		"exp": exp,
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

func (s *JWTService) VerifyAccessToken(token string) (userId int, err error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}

		// Возвращаем ключ для проверки подписи
		// return []byte("my_secret_key"), nil
		return s.acSecret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("всратые данные в токене")
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return 0, fmt.Errorf("invalid user ID format: %v", err)
	}
	retVal, err := strconv.Atoi(sub)
	if err != nil {
		return 0, fmt.Errorf("JOPA")
	}
	return retVal, nil
}
func (s *JWTService) VerifyRefreshToken(token string) error {
	return nil
}
