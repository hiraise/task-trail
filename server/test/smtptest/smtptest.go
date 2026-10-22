// Package smtptest — SMTP-сервер для тестов почты (ADR-0017): принимает письма на 127.0.0.1
// и отдаёт их тесту. Умеет STARTTLS, TLS сразу и вход AUTH PLAIN со своим сертификатом.
package smtptest

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"io"
	"math/big"
	"mime"
	"mime/quotedprintable"
	"net"
	"net/mail"
	"net/textproto"
	"strings"
	"sync"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
)

// Message — принятое письмо.
type Message struct {
	From string
	To   []string
	Data []byte
}

// Header — заголовок письма, закодированные слова (=?UTF-8?…?=) раскодированы.
func (m Message) Header(t testing.TB, name string) string {
	t.Helper()
	msg := m.parse(t)
	value, err := new(mime.WordDecoder).DecodeHeader(msg.Header.Get(name))
	if err != nil {
		t.Fatalf("заголовок %s: %v", name, err)
	}
	return value
}

// Text — тело письма с раскодированным Content-Transfer-Encoding.
func (m Message) Text(t testing.TB) string {
	t.Helper()
	msg := m.parse(t)
	body := msg.Body
	switch strings.ToLower(msg.Header.Get("Content-Transfer-Encoding")) {
	case "quoted-printable":
		body = quotedprintable.NewReader(body)
	case "base64":
		body = base64.NewDecoder(base64.StdEncoding, body)
	}
	text, err := io.ReadAll(body)
	if err != nil {
		t.Fatalf("тело письма: %v", err)
	}
	return string(text)
}

func (m Message) parse(t testing.TB) *mail.Message {
	t.Helper()
	msg, err := mail.ReadMessage(strings.NewReader(string(m.Data)))
	if err != nil {
		t.Fatalf("письмо не разобрано: %v", err)
	}
	return msg
}

type mode int

const (
	plain mode = iota
	startTLS
	implicitTLS
)

type Server struct {
	t        testing.TB
	listener net.Listener
	mode     mode
	tls      *tls.Config
	// RootCAs — корневой сертификат для клиента: notification.WithRootCAs.
	RootCAs  *x509.CertPool
	username string
	password string
	// rejected — получатели, которых сервер не принимает, как несуществующий ящик.
	rejected map[string]bool

	mu       sync.Mutex
	messages []Message
}

type Option func(*Server)

// WithSTARTTLS — сервер предлагает STARTTLS.
func WithSTARTTLS() Option { return func(s *Server) { s.mode = startTLS } }

// WithTLS — TLS с первого байта, как на порту 465.
func WithTLS() Option { return func(s *Server) { s.mode = implicitTLS } }

// WithAuth — письма принимаются только после AUTH PLAIN с этим логином и паролем.
func WithAuth(username, password string) Option {
	return func(s *Server) { s.username, s.password = username, password }
}

// WithRejected — сервер отказывает этим получателям (550), остальным письма доходят.
func WithRejected(addresses ...string) Option {
	return func(s *Server) {
		s.rejected = make(map[string]bool, len(addresses))
		for _, a := range addresses {
			s.rejected[a] = true
		}
	}
}

// New запускает сервер; он останавливается после теста.
func New(t testing.TB, opts ...Option) *Server {
	t.Helper()
	s := &Server{t: t}
	for _, opt := range opts {
		opt(s)
	}
	s.tls, s.RootCAs = selfSigned(t)
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	if s.mode == implicitTLS {
		listener = tls.NewListener(listener, s.tls)
	}
	s.listener = listener
	t.Cleanup(func() { _ = listener.Close() })
	go s.serve()
	return s
}

// Settings — настройки почты для этого сервера: шифрование по его режиму, вход — если задан.
func (s *Server) Settings() *entity.MailSettings {
	addr := s.listener.Addr().(*net.TCPAddr)
	settings := &entity.MailSettings{
		Host:       addr.IP.String(),
		Port:       addr.Port,
		Encryption: entity.MailEncryptionNone,
		Sender:     "TaskTrail <noreply@tasktrail.test>",
	}
	switch s.mode {
	case startTLS:
		settings.Encryption = entity.MailEncryptionSTARTTLS
	case implicitTLS:
		settings.Encryption = entity.MailEncryptionTLS
	}
	if s.username != "" {
		settings.Username, settings.Password = &s.username, &s.password
	}
	return settings
}

// Messages — письма, принятые к этому моменту.
func (s *Server) Messages() []Message {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Message(nil), s.messages...)
}

// Last — последнее письмо; без писем тест падает.
func (s *Server) Last(t testing.TB) Message {
	t.Helper()
	messages := s.Messages()
	if len(messages) == 0 {
		t.Fatal("писем нет")
	}
	return messages[len(messages)-1]
}

func (s *Server) serve() {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			return
		}
		go s.session(conn)
	}
}

// session ведёт разговор по RFC 5321 в том объёме, который нужен клиенту go-mail.
func (s *Server) session(conn net.Conn) {
	defer func() { _ = conn.Close() }()
	_ = conn.SetDeadline(time.Now().Add(10 * time.Second))
	text := textproto.NewConn(conn)
	reply := func(lines ...string) {
		for i, line := range lines {
			sep := " "
			if i < len(lines)-1 {
				sep = "-"
			}
			_ = text.PrintfLine("%s%s%s", line[:3], sep, line[4:])
		}
	}
	_, encrypted := conn.(*tls.Conn)
	authed := s.username == ""
	var msg Message
	reply("220 smtptest")
	for {
		line, err := text.ReadLine()
		if err != nil {
			return
		}
		verb, arg, _ := strings.Cut(line, " ")
		switch strings.ToUpper(verb) {
		case "EHLO", "HELO":
			lines := []string{"250 smtptest"}
			if s.mode == startTLS && !encrypted {
				lines = append(lines, "250 STARTTLS")
			}
			if s.username != "" {
				lines = append(lines, "250 AUTH PLAIN")
			}
			reply(lines...)
		case "STARTTLS":
			if s.mode != startTLS || encrypted {
				reply("502 STARTTLS не поддерживается")
				continue
			}
			reply("220 готов к TLS")
			tlsConn := tls.Server(conn, s.tls)
			if err := tlsConn.Handshake(); err != nil {
				return
			}
			conn, encrypted, text = tlsConn, true, textproto.NewConn(tlsConn)
		case "AUTH":
			reply(s.auth(text, arg, &authed))
		case "MAIL":
			if !authed {
				reply("530 нужен вход")
				continue
			}
			msg = Message{From: address(arg)}
			reply("250 OK")
		case "RCPT":
			if to := address(arg); s.rejected[to] {
				reply("550 нет такого ящика")
			} else {
				msg.To = append(msg.To, to)
				reply("250 OK")
			}
		case "DATA":
			reply("354 жду письмо")
			data, err := text.ReadDotBytes()
			if err != nil {
				return
			}
			msg.Data = data
			s.mu.Lock()
			s.messages = append(s.messages, msg)
			s.mu.Unlock()
			reply("250 принято")
		case "RSET", "NOOP":
			reply("250 OK")
		case "QUIT":
			reply("221 до свидания")
			return
		default:
			reply("502 команда не поддерживается")
		}
	}
}

// auth проверяет AUTH PLAIN: ответ клиента — сразу в команде или следующей строкой.
func (s *Server) auth(text *textproto.Conn, arg string, authed *bool) string {
	mech, initial, _ := strings.Cut(arg, " ")
	if !strings.EqualFold(mech, "PLAIN") || s.username == "" {
		return "504 способ входа не поддерживается"
	}
	if initial == "" {
		_ = text.PrintfLine("334 ")
		line, err := text.ReadLine()
		if err != nil {
			return "501 нет ответа"
		}
		initial = line
	}
	decoded, err := base64.StdEncoding.DecodeString(initial)
	if err != nil {
		return "501 не base64"
	}
	parts := strings.Split(string(decoded), "\x00")
	if len(parts) != 3 || parts[1] != s.username || parts[2] != s.password {
		return "535 неверный логин или пароль"
	}
	*authed = true
	return "235 вход выполнен"
}

// address достаёт адрес из «FROM:<a@b> BODY=8BITMIME».
func address(arg string) string {
	start, end := strings.Index(arg, "<"), strings.Index(arg, ">")
	if start < 0 || end < start {
		return ""
	}
	return arg[start+1 : end]
}

// selfSigned выпускает сертификат на 127.0.0.1 и возвращает его же как корневой для клиента.
func selfSigned(t testing.TB) (*tls.Config, *x509.CertPool) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "smtptest"},
		IPAddresses:           []net.IP{net.IPv4(127, 0, 0, 1)},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IsCA:                  true,
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	pool := x509.NewCertPool()
	pool.AddCert(cert)
	return &tls.Config{Certificates: []tls.Certificate{{Certificate: [][]byte{der}, PrivateKey: key}}}, pool
}
