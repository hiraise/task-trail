package persistent

import (
	"context"
	"encoding/json"
	"errors"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Row keys of the settings table. The key is also the secret's encryption label: a secret moved
// to another row will not decrypt.
const (
	settingsService = "service"
	settingsMail    = "mail"
)

// SecretBox encrypts setting secrets (secretbox.Box).
type SecretBox interface {
	Seal(plaintext []byte, label string) ([]byte, error)
	Open(sealed []byte, label string) ([]byte, error)
}

type PGSettingsRepository struct {
	PgRepository
	box SecretBox
}

func NewSettingsRepo(db *pgxpool.Pool, box SecretBox) *PGSettingsRepository {
	return &PGSettingsRepository{PgRepository: PgRepository{pg: db}, box: box}
}

type serviceValue struct {
	ServiceURL string `json:"serviceUrl"`
}

type mailValue struct {
	Host       string                `json:"host"`
	Port       int                   `json:"port"`
	Encryption entity.MailEncryption `json:"encryption"`
	Sender     string                `json:"sender"`
	Username   *string               `json:"username"`
}

func (r *PGSettingsRepository) GetServiceURL(ctx context.Context) (string, error) {
	var value serviceValue
	found, _, err := r.get(ctx, settingsService, &value)
	if err != nil || !found {
		return "", err
	}
	return value.ServiceURL, nil
}

func (r *PGSettingsRepository) SetServiceURL(ctx context.Context, url string) error {
	return r.put(ctx, settingsService, serviceValue{ServiceURL: url}, nil)
}

func (r *PGSettingsRepository) GetMail(ctx context.Context) (*entity.MailSettings, error) {
	var value mailValue
	found, secret, err := r.get(ctx, settingsMail, &value)
	if err != nil || !found {
		return nil, err
	}
	settings := &entity.MailSettings{
		Host:       value.Host,
		Port:       value.Port,
		Encryption: value.Encryption,
		Sender:     value.Sender,
		Username:   value.Username,
	}
	if secret != nil {
		if password, err := r.box.Open(secret, settingsMail); err == nil {
			p := string(password)
			settings.Password = &p
		}
	}
	return settings, nil
}

func (r *PGSettingsRepository) SaveMail(ctx context.Context, s *entity.MailSettings) error {
	var secret []byte
	if s.Password != nil {
		sealed, err := r.box.Seal([]byte(*s.Password), settingsMail)
		if err != nil {
			return r.handleError(err)
		}
		secret = sealed
	}
	value := mailValue{Host: s.Host, Port: s.Port, Encryption: s.Encryption, Sender: s.Sender, Username: s.Username}
	return r.put(ctx, settingsMail, value, secret)
}

func (r *PGSettingsRepository) DeleteMail(ctx context.Context) error {
	if _, err := r.getDb(ctx).Exec(ctx, `DELETE FROM settings WHERE key = $1`, settingsMail); err != nil {
		return r.handleError(err)
	}
	return nil
}

// get reads a settings row into value; found is false if the row is missing.
func (r *PGSettingsRepository) get(ctx context.Context, key string, value any) (found bool, secret []byte, err error) {
	var raw []byte
	err = r.getDb(ctx).QueryRow(ctx, `SELECT value, secret FROM settings WHERE key = $1`, key).Scan(&raw, &secret)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil, nil
	}
	if err != nil {
		return false, nil, r.handleError(err)
	}
	if err := json.Unmarshal(raw, value); err != nil {
		return false, nil, r.handleError(err)
	}
	return true, secret, nil
}

func (r *PGSettingsRepository) put(ctx context.Context, key string, value any, secret []byte) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return r.handleError(err)
	}
	query := `
		INSERT INTO settings (key, value, secret, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, secret = EXCLUDED.secret, updated_at = EXCLUDED.updated_at`
	if _, err := r.getDb(ctx).Exec(ctx, query, key, raw, secret); err != nil {
		return r.handleError(err)
	}
	return nil
}
