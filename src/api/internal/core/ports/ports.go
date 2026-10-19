package ports

import (
	"context"

	"some-handle-stuff/internal/core/domain"
)

// Inbound port: what the application offers to the outside world.
type TaskService interface {
	Create(ctx context.Context, title string) (domain.Task, error)
	Get(ctx context.Context, id string) (domain.Task, error)
	Complete(ctx context.Context, id string) (domain.Task, error)
	List(ctx context.Context) ([]domain.Task, error)
	Delete(ctx context.Context, id string) error
}

// Outbound ports: what the application needs from the outside world.
type TaskRepository interface {
	Save(ctx context.Context, task domain.Task) error
	FindByID(ctx context.Context, id string) (domain.Task, error)
	List(ctx context.Context) ([]domain.Task, error)
	Delete(ctx context.Context, id string) error
}

type IDGenerator interface {
	NewID() string
}
