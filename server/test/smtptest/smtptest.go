// Package smtptest is an SMTP server for mail tests (ADR-0017): it accepts emails on 127.0.0.1
// and hands them to the test. Supports STARTTLS, implicit TLS and AUTH PLAIN sign-in with its own certificate.
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

// Message is an accepted email.
type Message struct {
	From string
	To   []string
	Data []byte
}

// Header is an email header with encoded words (=?UTF-8?…?=) decoded.
func (m Message) Header(t testing.TB, name string) string {
	t.Helper()
	msg := m.parse(t)
	value, err := new(mime.WordDecoder).DecodeHeader(msg.Header.Get(name))
	if err != nil {
		t.Fatalf("header %s: %v", name, err)
	}
	return value
}

// Text is the email body with Content-Transfer-Encoding decoded.
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
		t.Fatalf("email body: %v", err)
	}
	return string(text)
}

func (m Message) parse(t testing.TB) *mail.Message {
	t.Helper()
	msg, err := mail.ReadMessage(strings.NewReader(string(m.Data)))
	if err != nil {
		t.Fatalf("email not parsed: %v", err)
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
	// RootCAs is the root certificate for the client: notification.WithRootCAs.
	RootCAs  *x509.CertPool
	username string
	password string
	// rejected are recipients the server does not accept, like a nonexistent mailbox.
	rejected map[string]bool
	// rejectedSenders are senders the server does not accept, like a foreign address.
	rejectedSenders map[string]bool

	mu       sync.Mutex
	messages []Message
}

type Option func(*Server)

// WithSTARTTLS: the server offers STARTTLS.
func WithSTARTTLS() Option { return func(s *Server) { s.mode = startTLS } }

// WithTLS: TLS from the first byte, as on port 465.
func WithTLS() Option { return func(s *Server) { s.mode = implicitTLS } }

// WithAuth: emails are accepted only after AUTH PLAIN with this login and password.
func WithAuth(username, password string) Option {
	return func(s *Server) { s.username, s.password = username, password }
}

// WithRejected: the server rejects these recipients (550), emails to the rest arrive.
func WithRejected(addresses ...string) Option {
	return func(s *Server) {
		s.rejected = make(map[string]bool, len(addresses))
		for _, a := range addresses {
			s.rejected[a] = true
		}
	}
}

// WithRejectedSenders: the server rejects emails from these senders (553), like a mail
// service that does not allow sending from a foreign address.
func WithRejectedSenders(addresses ...string) Option {
	return func(s *Server) {
		s.rejectedSenders = make(map[string]bool, len(addresses))
		for _, a := range addresses {
			s.rejectedSenders[a] = true
		}
	}
}

// New starts the server; it stops after the test.
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

// Settings are the mail settings for this server: encryption by its mode, sign-in if set.
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

// Messages are the emails accepted so far.
func (s *Server) Messages() []Message {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Message(nil), s.messages...)
}

// Last is the last email; the test fails if there are none.
func (s *Server) Last(t testing.TB) Message {
	t.Helper()
	messages := s.Messages()
	if len(messages) == 0 {
		t.Fatal("no emails")
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

// session conducts the RFC 5321 conversation to the extent the go-mail client needs.
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
				reply("502 STARTTLS not supported")
				continue
			}
			reply("220 ready to start TLS")
			tlsConn := tls.Server(conn, s.tls)
			if err := tlsConn.Handshake(); err != nil {
				return
			}
			conn, encrypted, text = tlsConn, true, textproto.NewConn(tlsConn)
		case "AUTH":
			reply(s.auth(text, arg, &authed))
		case "MAIL":
			if !authed {
				reply("530 authentication required")
				continue
			}
			if from := address(arg); s.rejectedSenders[from] {
				reply("553 sender address not owned by you")
			} else {
				msg = Message{From: from}
				reply("250 OK")
			}
		case "RCPT":
			if to := address(arg); s.rejected[to] {
				reply("550 no such mailbox")
			} else {
				msg.To = append(msg.To, to)
				reply("250 OK")
			}
		case "DATA":
			reply("354 start mail input")
			data, err := text.ReadDotBytes()
			if err != nil {
				return
			}
			msg.Data = data
			s.mu.Lock()
			s.messages = append(s.messages, msg)
			s.mu.Unlock()
			reply("250 accepted")
		case "RSET", "NOOP":
			reply("250 OK")
		case "QUIT":
			reply("221 bye")
			return
		default:
			reply("502 command not supported")
		}
	}
}

// auth checks AUTH PLAIN: the client's response is either in the command or on the next line.
func (s *Server) auth(text *textproto.Conn, arg string, authed *bool) string {
	mech, initial, _ := strings.Cut(arg, " ")
	if !strings.EqualFold(mech, "PLAIN") || s.username == "" {
		return "504 authentication mechanism not supported"
	}
	if initial == "" {
		_ = text.PrintfLine("334 ")
		line, err := text.ReadLine()
		if err != nil {
			return "501 no response"
		}
		initial = line
	}
	decoded, err := base64.StdEncoding.DecodeString(initial)
	if err != nil {
		return "501 not base64"
	}
	parts := strings.Split(string(decoded), "\x00")
	if len(parts) != 3 || parts[1] != s.username || parts[2] != s.password {
		return "535 invalid login or password"
	}
	*authed = true
	return "235 authentication successful"
}

// address extracts the address from "FROM:<a@b> BODY=8BITMIME".
func address(arg string) string {
	start, end := strings.Index(arg, "<"), strings.Index(arg, ">")
	if start < 0 || end < start {
		return ""
	}
	return arg[start+1 : end]
}

// selfSigned issues a certificate for 127.0.0.1 and returns it as the root for the client too.
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
