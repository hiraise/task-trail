package gomail

import (
	"task-trail/internal/pkg/logger"
	"task-trail/internal/pkg/smtp"

	"github.com/wneessen/go-mail"
)

type GomailSender struct {
	client *mail.Client
	logger logger.Logger
	from   string
}

func New(logger logger.Logger, host string, port int, login string, password string, sender string) *GomailSender {
	opts := []mail.Option{
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(login),
		mail.WithPassword(password),
		mail.WithPort(port),
		mail.WithTLSPolicy(mail.TLSMandatory),
	}
	client, err := mail.NewClient(host, opts...)
	if err != nil {
		panic(err)
	}
	return &GomailSender{client: client, logger: logger, from: sender}
}

func (s *GomailSender) Send(msg smtp.Message, eventID string) error {
	m := mail.NewMsg()
	if err := m.From(s.from); err != nil {
		return err
	}
	if err := m.To(msg.Recipients...); err != nil {
		return err
	}
	m.Subject(msg.Subject)
	m.SetBodyString(mail.TypeTextHTML, msg.Text)
	s.logger.Info("start email sending event", "eventID", eventID, "recipients", msg.Recipients)
	go func(msg *mail.Msg, eventID string, logger logger.Logger) {
		err := s.client.DialAndSend(m)
		if err != nil {
			logger.Error("sending email failed", "eventID", eventID, "error", err)
			return
		}
		logger.Info("email successfully sent", "eventID", eventID)
	}(m, eventID, s.logger)

	return nil
}
