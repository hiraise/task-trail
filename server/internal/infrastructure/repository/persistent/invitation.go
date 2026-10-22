package persistent

import (
	"context"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGInvitationRepository struct {
	PgRepository
}

func NewInvitationRepo(db *pgxpool.Pool) *PGInvitationRepository {
	return &PGInvitationRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGInvitationRepository) Create(ctx context.Context, i *entity.Invitation) error {
	query := `
		INSERT INTO invitations (id, project_id, email, invited_by, token_hash, expired_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT ON CONSTRAINT invitations_project_email DO UPDATE SET
			id = EXCLUDED.id, invited_by = EXCLUDED.invited_by, token_hash = EXCLUDED.token_hash,
			expired_at = EXCLUDED.expired_at, created_at = EXCLUDED.created_at`
	_, err := r.getDb(ctx).Exec(ctx, query, i.ID, i.ProjectID, i.Email, i.InvitedBy, []byte(i.TokenHash), i.ExpiredAt, i.CreatedAt)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

const invitationColumns = `i.id, i.project_id, i.email, i.invited_by, i.token_hash, i.expired_at, i.created_at`

func (r *PGInvitationRepository) GetByTokenHash(ctx context.Context, hash entity.LinkTokenHash) (*repository.InvitationDetails, error) {
	query := `
		SELECT ` + invitationColumns + `, p.name, u.username, u.email
		FROM invitations i
		JOIN projects p ON p.id = i.project_id
		JOIN users u ON u.id = i.invited_by
		WHERE i.token_hash = $1 AND p.deleted_at IS NULL`
	var details repository.InvitationDetails
	var inviterEmail string
	row := r.getDb(ctx).QueryRow(ctx, query, []byte(hash))
	invitation, err := scanInvitation(row, &details.ProjectName, &details.InviterUsername, &inviterEmail)
	if err != nil {
		return nil, r.handleError(err)
	}
	details.Invitation = invitation
	details.InviterEmail = entity.Email(inviterEmail)
	return &details, nil
}

func (r *PGInvitationRepository) ListByEmail(ctx context.Context, email entity.Email) ([]*entity.Invitation, error) {
	query := `
		SELECT ` + invitationColumns + `
		FROM invitations i
		JOIN projects p ON p.id = i.project_id
		WHERE i.email = $1 AND p.deleted_at IS NULL
		ORDER BY i.created_at, i.id`
	rows, err := r.getDb(ctx).Query(ctx, query, email)
	if err != nil {
		return nil, r.handleError(err)
	}
	invitations, err := ScanRows(rows, func(row pgx.Rows) (*entity.Invitation, error) { return scanInvitation(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return invitations, nil
}

func (r *PGInvitationRepository) DeleteExpired(ctx context.Context, now time.Time) (int64, error) {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM invitations WHERE expired_at <= $1`, now)
	if err != nil {
		return 0, r.handleError(err)
	}
	return tag.RowsAffected(), nil
}

// scanInvitation reads the invitationColumns columns and then extra.
func scanInvitation(row pgx.Row, extra ...any) (*entity.Invitation, error) {
	var id, projectID, email, invitedBy string
	var tokenHash []byte
	i := &entity.Invitation{}
	dest := append([]any{&id, &projectID, &email, &invitedBy, &tokenHash, &i.ExpiredAt, &i.CreatedAt}, extra...)
	if err := row.Scan(dest...); err != nil {
		return nil, err
	}
	i.ID = entity.InvitationID(id)
	i.ProjectID = entity.ProjectID(projectID)
	i.Email = entity.Email(email)
	i.InvitedBy = entity.UserID(invitedBy)
	i.TokenHash = tokenHash
	return i, nil
}
