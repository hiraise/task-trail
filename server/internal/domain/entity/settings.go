package entity

// MailEncryption — как защищено соединение с SMTP (ADR-0017).
type MailEncryption string

const (
	MailEncryptionNone     MailEncryption = "none"
	MailEncryptionSTARTTLS MailEncryption = "starttls"
	MailEncryptionTLS      MailEncryption = "tls"
)

// MailSettings — подключение к SMTP, которое администратор задаёт в интерфейсе (ADR-0017).
type MailSettings struct {
	Host       string
	Port       int
	Encryption MailEncryption
	Sender     string
	// Username — nil, если SMTP принимает почту без входа.
	Username *string
	// Password — nil, если пароля нет или он не расшифровался: секрет, который
	// не расшифровывается, считается не заданным (ADR-0015).
	Password *string
}
