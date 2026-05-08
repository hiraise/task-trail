package token

import (
	"fmt"
	"strings"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/infrastructure/service/id"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTTokenService struct {
	atSecret   []byte
	atLifeTime time.Duration
	rtSecret   []byte
	rtLifetime time.Duration
	iss        string
	uuidGen    *id.UUIDGenerator
}

func New(
	atSecret string,
	atLifeMin time.Duration,
	rtSecret string,
	tokenIssuer string,
	uuidGenerator *id.UUIDGenerator,
) *JWTTokenService {
	return &JWTTokenService{
		atSecret:   []byte(atSecret),
		atLifeTime: atLifeMin,
		rtSecret:   []byte(rtSecret),
		iss:        tokenIssuer,
		uuidGen:    uuidGenerator,
	}
}

func (s *JWTTokenService) GenerateTokensPair(userID entity.UserID, rtEntity *entity.RefreshToken) (dto.AccessToken, dto.RefreshToken, error) {
	at, err := s.GenerateAccessToken(userID)
	if err != nil {
		return dto.AccessToken{}, dto.RefreshToken{}, err
	}
	rt, err := s.GenerateRefreshToken(userID, rtEntity)
	if err != nil {
		return dto.AccessToken{}, dto.RefreshToken{}, err
	}
	return at, rt, nil
}

func (s *JWTTokenService) GenerateAccessToken(userID entity.UserID) (dto.AccessToken, error) {
	exp := time.Now().Add(s.atLifeTime)
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": exp.Unix(),
		"iss": s.iss,
	}
	t, err := s.genToken(claims, s.atSecret)
	if err != nil {
		return dto.AccessToken{}, err
	}
	return dto.AccessToken{Token: t, ExpiredAt: exp}, nil
}

func (s *JWTTokenService) GenerateRefreshToken(userID entity.UserID, rtEntity *entity.RefreshToken) (dto.RefreshToken, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": rtEntity.ExpiredAt.Unix(),
		"jti": rtEntity.ID,
		"iss": s.iss,
	}
	t, err := s.genToken(claims, s.rtSecret)
	if err != nil {
		return dto.RefreshToken{}, err
	}
	return dto.RefreshToken{Token: t, ExpiredAt: rtEntity.ExpiredAt}, nil

}

func (s *JWTTokenService) genToken(claims jwt.Claims, secret []byte) (string, error) {
	raw := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := raw.SignedString(secret)
	if err != nil {
		return "", domain.ErrTokenGenerateFailed(err)
	}
	return t, nil

}

func (s *JWTTokenService) VerifyAccessToken(token string) (string, error) {
	claims, err := s.verifyToken(token, s.atSecret)
	if err != nil {
		if strings.Contains(err.Error(), "token is expired") {
			return "", domain.ErrAccessTokenExpired()
		}
		return "", domain.ErrWrongAccessToken()
	}
	userID, err := s.extractClaim(claims, "sub")
	if err != nil {
		return "", domain.FailedToParseToken(err, claims)
	}
	return userID, nil
}
func (s *JWTTokenService) VerifyRefreshToken(token string) (string, string, error) {
	claims, err := s.verifyToken(token, s.rtSecret)
	if err != nil {
		if strings.Contains(err.Error(), "token is expired") {
			return "", "", domain.ErrRefreshTokenExpired()
		}
		return "", "", domain.ErrWrongRefreshToken()
	}
	userID, err := s.extractClaim(claims, "sub")
	if err != nil {
		return "", "", domain.FailedToParseToken(err, claims)
	}
	jti, err := s.extractClaim(claims, "jti")
	if err != nil {
		return "", "", domain.FailedToParseToken(err, claims)
	}
	return userID, jti, nil
}

func (s *JWTTokenService) verifyToken(token string, secret []byte) (jwt.MapClaims, error) {
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

func (s *JWTTokenService) extractClaim(claims jwt.MapClaims, name string) (string, error) {
	claim, ok := claims[name].(string)
	if !ok {
		return claim, fmt.Errorf("%s is not a string, %s: %v", name, name, claim)
	}
	return claim, nil
}
