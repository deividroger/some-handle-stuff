package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"some-handle-stuff/internal/core/domain"
	"some-handle-stuff/internal/core/ports"
)

type TaskRepository struct {
	pool *pgxpool.Pool
}

var _ ports.TaskRepository = (*TaskRepository)(nil)

func NewTaskRepository(pool *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{pool: pool}
}

func (r *TaskRepository) Save(ctx context.Context, t domain.Task) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO tasks (id, title, done) VALUES ($1, $2, $3)
		 ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, done = EXCLUDED.done`,
		t.ID, t.Title, t.Done)
	return err
}

func (r *TaskRepository) FindByID(ctx context.Context, id string) (domain.Task, error) {
	var t domain.Task
	err := r.pool.QueryRow(ctx,
		`SELECT id, title, done FROM tasks WHERE id = $1`, id).
		Scan(&t.ID, &t.Title, &t.Done)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Task{}, domain.ErrTaskNotFound
	}
	return t, err
}

func (r *TaskRepository) List(ctx context.Context) ([]domain.Task, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, title, done FROM tasks ORDER BY created_at, id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := []domain.Task{}
	for rows.Next() {
		var t domain.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Done); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrTaskNotFound
	}
	return nil
}
