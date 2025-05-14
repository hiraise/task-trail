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
	VerifyAccessToken(token string) (userId int, err error)
	VerifyRefreshToken(token string) (userId int, jti string, err error)
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
	atSecret string,
	atLifeMin int,
	rtSecret string,
	rtLifeMin int,
	tokenIssuer string,
	uuidGenerator uuid.Generator,
) *JWTService {
	return &JWTService{
		acSecret:   []byte(atSecret),
		acLifetime: time.Duration(atLifeMin),
		rtSecret:   []byte(rtSecret),
		rtLifetime: time.Duration(rtLifeMin),
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

func (s *JWTService) VerifyAccessToken(token string) (userId int, err error) {
	claims, err := s.verifyToken(token, s.acSecret)
	if err != nil {
		return
	}
	userId, err = s.extractSub(claims)
	if err != nil {
		return
	}
	return
}
func (s *JWTService) VerifyRefreshToken(token string) (userId int, jti string, err error) {
	claims, err := s.verifyToken(token, s.rtSecret)
	if err != nil {
		return
	}
	userId, err = s.extractSub(claims)
	if err != nil {
		return
	}
	jti, err = s.extractClaim(claims, "jti")
	if err != nil {
		return
	}
	return
}

func (s *JWTService) verifyToken(token string, secret []byte) (jwt.MapClaims, error) {
	t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return nil, err
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("claims are invalid, claims: %v", claims)
	}
	return claims, nil
}

func (s *JWTService) extractSub(claims jwt.MapClaims) (int, error) {
	sub, err := s.extractClaim(claims, "sub")
	if err != nil {
		return 0, err
	}
	v, err := strconv.Atoi(sub)
	if err != nil {
		return 0, fmt.Errorf("sub is not an int, sub: %v", sub)
	}
	return v, nil
}

func (s *JWTService) extractClaim(claims jwt.MapClaims, name string) (string, error) {
	claim, ok := claims[name].(string)
	if !ok {
		return claim, fmt.Errorf("%s is not a string, %s: %v", name, name, claim)
	}
	return claim, nil
}
